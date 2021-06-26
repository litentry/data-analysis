# Introduction
This project is built on the top of thegraph, used to index information of ERC20 token. 
following informaiton is availabel right now: 

1. balance: balance of this token
2. maxBalance:max balance of this wallet address for the given token
3. countOut: Number of transfer totally for the given token
4. countIn: Number of transfer out for the given token
5. countTotal: Number of transfer totally for the given token
6. amountIn: amount of transfer in for the given token
7. amountOut: amount of transfer out for the given token
8. amountTotal: amount of transfer totally for the given token
9. amountAver: average amount per transfer


# Queries (HTTP)
https://api.thegraph.com/subgraphs/name/moehringen/erc20

# Playgournd 
https://thegraph.com/explorer/subgraph/moehringen

# Currently support ERC20 Token
1. Lit(Litentry)
2. ATA(Automata)

# Example of Query
1. Query all transactions of a wallet address for a spicific token,here token id is"wallet address-token contract address"
    {
        transactions(where: {tokenID: "0x000000000000084e91743124a982076c59f10084-0xb59490ab09a0f526cc7305822ac65f2ab12f9723"}) {
        id
        amount
        direction
        tokenID
        date
        balance
        }
    }

2. Query the summary of a wallet address for a spicific token, here  id is"wallet address-token contract address"
    {
   assets(where:{id:"0x0000000000007f150bd6f54c40a34d7c3d5e9f56-0xb59490ab09a0f526cc7305822ac65f2ab12f9723"}) {
    id
    name
    symbol
    decimals
    balance
    maxBalance
    amountAver
    countTotal
    amountTotal
    countIn
    countOut
    amountIn
    amountOut
     }
   }

3. Query all the summay and transactions of all tokens the wallet address holds, here id is the wallet address
     {
  users(where: {id: "0x0168ac5760b2669d6fa0bd3046afef2db824f871"}) {
    id
    assets {
      id
      amountTotal
      balance
      maxBalance
      countTotal
      countIn
      countOut
      amountOut
      amountIn
    }
    transactions {
      id
      direction
      amount
      balance
      hash
      date
    }
  }
}
