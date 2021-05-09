## Description

This project is for crawling transactions and wallet balance information. It's based on etherscan and thegraph. In order to run the project, move to py-etherscan-api/project.

To crawl transactions, run the following command:
    
    python3 crawl_trans.py --address_file address.json.txt --contract_file contracts.txt --exchange_file exchange_address.txt 
    
Check crawl_trans.py for more options. This script currently only supports finding one layer transaction.

To crawl wallet balance, run the following command:

    python3 crawl_balance_and_graph.py --public_pool_file publicpool.csv
    

## Requirements

- pandas
- py-etherscan-api in this repo

## TODO

- Support more layer transaction
- Support distributed crawling