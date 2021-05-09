import etherscan.accounts as accounts
import time
import json
import requests
import argparse

parser = argparse.ArgumentParser(description='Crawl transactions')
parser.add_argument('address_file', type=str,
                    help='an integer for the accumulator')
parser.add_argument('contract_file', type=str, default=None,
                    help='a file contain selected contract addresses')
parser.add_argument('exchange_file', type=str, default=None,
                    help='a file contain  exchange addresses')
parser.add_argument('n_days', type=int, default=100000000000,
                    help='crawl transactions within n_days to now')
parser.add_argument('least_value', type=float, default=-1.0,
                    help='only keep transactions with value greater than least_value')
args = parser.parse_args()


address_file = args.address_file
contract_file = args.contract_file
exchange_file = args.exchange_file
n_days = args.n_days
least_value = args.least_value


def get_exchanges():
    exchange_set = set([line.strip() for line in open(exchange_file, 'r').readlines()])
    print("find %s exchange addresses" % (len(exchange_set)))
    return exchange_set


def get_addresses():
    address_list = []
    with open(address_file, 'r') as fin:
        items = json.loads(fin.read())
        for user_info in items["user"]:
            address_list.append(user_info["address"])
    print("find %s target addresses" % (len(address_list)))
    return address_list


def get_contracts():
    contract_set = set([line.strip().lower() for line in open(contract_file, 'r').readlines()])
    print("find %s contract addresses" % (len(contract_set)))
    return contract_set


def days_to_now(timestamp):
    return (time.time() - int(timestamp)) / 3600 / 24


def get_contract_by_hash(hash):
    r = requests.get("https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt"
                     "&txhash=%s&apikey=DTTR16CPVKIE8XDIF4M6UB65J2X64Q77HS" % hash)
    dic = json.loads(r.content)
    logs = dic["result"]["logs"]
    if len(logs) == 0:
        contract = ""
    else:
        contract = logs[0]["address"]
    return contract


def get_father_to_hash(address, _n_days=1000000000000, _contracts=None, _least_value=0, _exchanges=None):
    api = accounts.Account(address=address, api_key="DTTR16CPVKIE8XDIF4M6UB65J2X64Q77HS")
    transactions = api.get_all_transactions(offset=100, sort='asc', internal=False)
    father2hash = dict()

    for transaction in transactions:
        father = transaction["from"]
        if _exchanges is not None and father in _exchanges:
            continue
        timestamp = transaction["timeStamp"]
        _hash = transaction["hash"]
        value = int(transaction["value"]) / 10 ** 18
        if days_to_now(timestamp) <= n_days and father != address and value > _least_value:
            if "contractAddress" in transaction:
                contract = transaction["contractAddress"]
            else:
                print("not find contract address in transaction information, call get_contract_by_hash")
                while True:
                    try:
                        contract = get_contract_by_hash(_hash)
                        break
                    except Exception as e:
                        print("hash: %s, error: %s" % (_hash, e))
                        time.sleep(0.21)
            if _contracts is None or _contracts is not None and contract in _contracts:
                if father not in father2hash:
                    father2hash[father] = []
                father2hash[father].append(_hash)
    return father2hash


def get_father_son_hash():
    sons = list(set(get_addresses()))
    exchanges = get_exchanges()
    contracts = get_contracts()
    father_son_hash = dict()
    i = 0
    for son in sons:
        print("crawling %s" % son)
        i += 1
        father2hash = get_father_to_hash(son, _n_days=n_days, _contracts=contracts,
                                         _least_value=least_value, _exchanges=exchanges)
        for father in father2hash:
            if father not in father_son_hash:
                father_son_hash[father] = {"son": [], "hash": []}
            father_son_hash[father]["son"].append(son)
            father_son_hash[father]["hash"].append(father2hash[father])
        print("finish crawl transactions of %s, find %s father node, progress: %s/%s" % (
            son, len(father2hash), i, len(sons)))
    return father_son_hash


def main():
    father_son_hash = get_father_son_hash()
    result = {"addresses": []}
    for father in father_son_hash:
        result["addresses"].append({"father": father,
                                    "son": father_son_hash[father]["son"],
                                    "hash": father_son_hash[father]["hash"]})
    fout = open("trans_graph.json", 'w')
    fout.write(json.dumps(result))


if __name__ == "__main__":
    main()
