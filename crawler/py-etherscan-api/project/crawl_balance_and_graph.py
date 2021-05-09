from etherscan.tokens import Tokens
import json
import pandas as pd
import time
import requests
import argparse

parser = argparse.ArgumentParser(description='Crawl token balance and thegraph info')
parser.add_argument('public_pool_file', type=str,
                    help='a csv file contain a column named address')
args = parser.parse_args()
df = pd.read_csv(args.public_pool_file)
address_list = df.address.values
print("find %s address in start list" % (len(address_list)))


def get_graph_result(address):
    jsons = {'query': '{exampleEntities(where: {purchaser: "%s"}) { \
        id \
        count \
        amount \
        purchaser \
      } \
    }' % address}
    r = requests.post("https://api.thegraph.com/subgraphs/name/moehringen/polkastarter", json=jsons)
    dic = json.loads(r.content.decode("utf-8"))
    graph_result = {}
    if len(dic['data']['exampleEntities']) > 0:
        print("%s found in polkastarter graph" % address)
        graph_result["count"] = dic['data']['exampleEntities'][0]["count"]
    else:
        print("%s not found in polkastarter graph" % address)
        graph_result["count"] = "0"

    jsons = {'query': '{polkamonOwners(where: {owner:"%s"}) {\
                      id \
                      owner \
                    }\
                }' % address}
    r = requests.post("https://api.thegraph.com/subgraphs/name/cuinf/polkamon", json=jsons)
    dic = json.loads(r.content.decode("utf-8"))
    if len(dic['data']['polkamonOwners']) > 0:
        print("%s found in polkamon graph" % address)
        graph_result["has_polkamon"] = True
    else:
        print("%s not found in polkamon graph" % address)
        graph_result["has_polkamon"] = False

    jsons = {'query': '{raribleOwners(where: {owner:"%s"}) {\
                          id \
                          owner \
                        }\
                    }' % address}
    r = requests.post("https://api.thegraph.com/subgraphs/name/cuinf/rarible", json=jsons)
    dic = json.loads(r.content.decode("utf-8"))
    if len(dic['data']['raribleOwners']) > 0:
        print("%s found in rarible graph" % address)
        graph_result["has_rarible"] = True
    else:
        print("%s not found in rarible graph" % address)
        graph_result["has_rarible"] = False

    jsons = {'query': '{kittyOwners(where: {owner:"%s"}) {\
                          id \
                          owner \
                        }\
                    }' % address}
    r = requests.post("https://api.thegraph.com/subgraphs/name/cuinf/cryptokitties", json=jsons)
    dic = json.loads(r.content.decode("utf-8"))
    if len(dic['data']['kittyOwners']) > 0:
        print("%s found in cryptokitties graph" % address)
        graph_result["has_cryptokitties"] = True
    else:
        print("%s not found in cryptokitties graph" % address)
        graph_result["has_cryptokitties"] = False
    return graph_result


contract_info = [("uni", '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'),
                 ("weth", '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
                 ("bondly", '0xd2dda223b2617cb616c1580db421e4cfae6a8a85'),
                 ("pols", '0x83e6f1E41cdd28eAcEB20Cb649155049Fac3D5Aa'),
                 ("curve", '0xD533a949740bb3306d119CC777fa900bA034cd52'),
                 ("compound", '0xc00e94cb662c3520282e6f5717214004a7f26888'),
                 ("synthetic", '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'),
                 ("maker", '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'),
                 ("aave", '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'),
                 ("shadows", '0x661Ab0Ed68000491d98C796146bcF28c20d7c559'),
                 ("frax", '0x853d955acef822db058eb8505911ed77f175b99e'),
                 ("mirror", '0x09a3EcAFa817268f77BE1283176B946C4ff2E608'),
                 ("alpha", '0xa1faa113cbe53436df28ff0aee54275c13b40975'),
                 ("fei", '0x956F47F50A910163D8BF957Cf5846D573E7f87CA'),
                 ("yfi", '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e'),
                 ("esd", '0x36F3FD68E7325a35EB768F1AedaAe9EA0689d723'),
                 ("dsd", '0xBD2F0Cd039E0BFcf88901C98c0bFAc5ab27566e3')
                 ]
result = {"uni": [], "weth": [], "bondly": [], "pols": [], "curve": [], "compound": [], "synthetic": [],
"maker": [], "aave": [], "shadows": [], "frax": [], "mirror": [], "alpha": [], "fei": [], "yfi": [],
"esd": [], "dsd": [], "address": [], "count": [], "has_polkamon": [], "has_rarible": [], "has_cryptokitties": [],}
n = 0
for address in address_list:
    n += 1
    print("%s/%s address processed" % (n, len(address_list)))
    result["address"].append(address)
    while True:
        try:
            graph_dic = get_graph_result(address)
            break
        except Exception as e:
            print(e)
    result["count"].append(graph_dic["count"])
    result["has_polkamon"].append(graph_dic["has_polkamon"])
    result["has_rarible"].append(graph_dic["has_rarible"])
    result["has_cryptokitties"].append(graph_dic["has_cryptokitties"])

    for contract_name, contract_address in contract_info:
        api = Tokens(contract_address=contract_address, api_key="DTTR16CPVKIE8XDIF4M6UB65J2X64Q77HS")
        while True:
            try:
                balance = api.get_token_balance(address=address)
                time.sleep(0.21)
                break
            except Exception as e:
                print(e)
        result[contract_name].append(float(balance)/10**18)

df = pd.DataFrame(result, columns=["address", "uni", "weth", "bondly", "pols","curve",
                                   "compound", "synthetic", "maker", "aave", "shadows",
                                   "frax", "mirror", "alpha", "fei", "yfi", "esd", "dsd",
                                   "count", "has_polkamon", "has_rarible", "has_cryptokitties"])
df.to_csv("balance_and_graph.csv")



