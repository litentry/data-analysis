This project is forked from /litentry/nft-scanner and extended to consider multiple networks.

# Generate subgraph.yaml
First, we need to generate a subgraph.yaml based on the provided nft list. For each network, we create a csv file respectively and store the corresponding nfts in it. When we call the generation command, we pass down the name of the csv file:

    node generate.js <csv_file_name>

# Compile & Deploy
    graph codegen
    graph auth https://api.thegraph.com/deploy/ <access token>
    graph deploy 
        --debug \
        --node https://api.thegraph.com/deploy/ \
        --ipfs https://api.thegraph.com/ipfs/ \
        <subgraph name>

# [ERC721 token](https://eips.ethereum.org/EIPS/eip-721)
    
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

# [Supported NFTs](./supportedNFTs.csv)
