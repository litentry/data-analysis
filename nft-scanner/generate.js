const _ = require('lodash');
var axios = require('axios');
const fs = require('fs');
const util = require('util');
const csv = require('csv-parser');
const yaml = require('js-yaml');
var isMappingGenerated = false;

/// Load ABI from etherscan
async function loadABI(contractAddress) {
  const config = {
    method: 'get',
    url: `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&format=raw`,
  };
  const resp = await axios(config);
  const abi = resp.data;
  return abi;
}

/// Write ABI to a given directory
function writeABI(path, abi) {
  fs.writeFileSync(path, JSON.stringify(abi));
}

///Read ABI from a given path
function readABI(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

/// Source code
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

let compiled = null;
function getCompiledSource(path) {
  if (_.isEmpty(compiled)) {
    const content = fs.readFileSync(path, 'utf8');
    compiled = _.template(content);
  }
  return compiled;
}

function generateSource(path, contractName, eventParamsMapping) {
  const compiled = getCompiledSource(path);
  const generatedSource = compiled({
    contract_name: contractName,
    eventParams_to: eventParamsMapping.to,
    eventParams_tokenId: eventParamsMapping.tokenId,
  });
  return generatedSource;
}

function writeSource(path, content) {
  fs.writeFileSync(path, content);
}

/// Subgraph
function loadSubgraphDataSourceTemplate(path) {
  const dataSourceTemplateFp = fs.readFileSync(path, 'utf8');
  const dataSourceTemplate = yaml.load(dataSourceTemplateFp);
  return dataSourceTemplate;
}

function assignDataSource(dataSourceTemplate, contract) {
  const cloned = _.cloneDeep(dataSourceTemplate);
  cloned['name'] = contract['name'];
  cloned['network'] = contract['network'];
  cloned['source']['address'] = contract['address'];
  cloned['source']['abi'] = contract['abi_name'];
  cloned['source']['startBlock'] = contract['start_block'];
  cloned['mapping']['abis'][0]['name'] = contract['abi_name'];
  cloned['mapping']['abis'][0]['file'] = contract['abi_file_path'];
  cloned['mapping']['file'] = contract['source_file_path'];
  cloned['mapping']['eventHandlers'] = [];
  for (let eventHandler of contract.eventHandlers) {
    cloned['mapping']['eventHandlers'].push({ event: eventHandler.event, handler: eventHandler.handler });
  }
  return cloned;
}

function writeSubgraph(path, dataSources) {
  if (!_.isArray(dataSources)) {
    dataSources = [dataSources];
  }
  const doc = {
    specVersion: '0.0.2',
    schema: { file: './schema.graphql' },
    dataSources: dataSources,
  };

  console.log(util.inspect(doc, { showHidden: false, depth: null }));
  fs.writeFileSync(path, yaml.dump(doc, { noRefs: true, quotingType: '"' }));
}

function getEventHandlerPair(event, inputs) {
  console.log(`Event: ${event}, inputs: ${util.inspect(inputs)}`);
  let inputString = [];
  for (let input of inputs) {
    if (input.indexed) {
      inputString.push(`indexed ${input.type}`);
    } else {
      inputString.push(`${input.type}`);
    }
  }
  return [`handle${event}`, `${event}(${inputString.join(',')})`];
}
function getTransferEventParamsMapping(inputs) {
  const paramsMapping = {
    from: inputs[0].name,
    to: inputs[1].name,
    tokenId: inputs[2].name,
  };
  console.log(`ParamsMapping: ${util.inspect(paramsMapping)}`);
  return paramsMapping;
}

async function run(contract) {
  if (contract.mapping_name == 'mapping') {//when a shared mapping is used
    contract['abi_name'] = 'ERC721';
    contract['abi_file_path'] = './abis/ERC721.json';
  } else {
    contract['abi_name'] = contract.name;
    contract['abi_file_path'] = `./abis/${contract.name}.json`;
  } 
  contract['source_file_path'] = `./src/${contract.mapping_name}.ts`;
  // Load ABI 
  console.log(`Loading *${contract.name}[${contract.address}]* ABI...`);
  var abi = null;
  if (contract.network == 'mainnet') { //write ABI currently only available in ethereum network mainnet
    abi = await loadABI(contract.address);
    writeABI(contract.abi_file_path, abi);
  } else { //use manually stored abis for other networks for now, TODO: available apis to get ABI from other networks?
    abi = readABI(contract.abi_file_path);
  }
  
  const interface = _.find(abi, { name: 'Transfer', type: 'event' });
  console.log(`Interface: ${util.inspect(interface, { showhidden: false, depth: null })}`);
  if (_.isEmpty(interface)) {
    throw new Error(`Event *Transfer* not found`);
  }

  const [handler, event] = getEventHandlerPair(interface.name, interface.inputs);
  contract.eventHandlers = [{ handler, event }];

  //// Generate mapping source codes --DO NOT NEEDED, USE A COMMON MAPPING
  if (!isMappingGenerated) {
    isMappingGenerated = true; //only allow to generate once for the common mapping file
    const sourceTemplatePath = './templates/sourceMapping.template.ts';
    const eventParamsMapping = getTransferEventParamsMapping(interface.inputs);
    const source = generateSource(sourceTemplatePath, contract.name, eventParamsMapping);
    writeSource(contract.source_file_path, source);
  }  

  /// Generate data source mappings
  const dataSourceTemplatePath = './templates/dataSource.template.yaml';
  const dataSourceTemplate = loadSubgraphDataSourceTemplate(dataSourceTemplatePath);
  const dataSource = assignDataSource(dataSourceTemplate, contract);
  return dataSource;
}

async function sleep(secs) {
  return new Promise(resolve => {
    setTimeout(resolve, secs * 1000);
  });
}

async function loadContracts(path) {
  const results = [];
  return new Promise(resolve => {
    fs.createReadStream(path)
      .pipe(
        csv({
          headers: ['name', 'network', 'address', 'start_block', 'official_website', 'mapping_name'],
          mapValues: ({ header, index, value }) => {
            if (header === 'name') {
              return value
                .trim()
                .split(' ')
                .join('');
            } else if (header === 'start_block') {
              return parseInt(value.trim(), 10);
            } else if (header === 'address') {
              return value.trim().toLowerCase();
            }
            return value;
          },
          // Ignore the header
          skipLines: 1,
        })
      )
      .on('data', data => results.push({...data }))
      .on('end', () => {
        resolve(_.uniqBy(results, 'name'));
      });
  });
}

(async () => {
  try {
    const csvArgPosition = 2;
    const supportedNftPath = process.argv[csvArgPosition];
    const contractList = await loadContracts(supportedNftPath);
    const dataSourceList = [];
    for (let contract of contractList) {
      try {
        const dataSource = await run(contract);
        dataSourceList.push(dataSource);
      } catch (e) {
        console.trace(e);
      }
      await sleep(7);
    }

    const subgraphPath = './subgraph.yaml';
    writeSubgraph(subgraphPath, dataSourceList);
  } catch (e) {
    console.log(e);
  }
})();
