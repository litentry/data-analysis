import { Birth, Transfer, CryptoKitties } from '../../generated/CryptoKitties/CryptoKitties'
import { TokenHolder } from '../../generated/schema'
import { log } from "@graphprotocol/graph-ts"

export function handleBirth(event: Birth): void {
    let id = event.address.toHex() + '#' + event.params.kittyId.toHex() //use kitty id as the entity id
    let entity = new TokenHolder(id)
    entity.contract = event.address;
    entity.tokenId = event.params.kittyId;
    entity.owner = event.params.owner;
    entity.save();

    //bind the contract address in order to be able to access the public methods of the contract
    // let contract = CryptoKitties.bind(event.address) 
    // let kittyBalance = new KittyBalance(event.params.owner.toHex())
    // kittyBalance.amount = contract.balanceOf(event.params.owner)
    // kittyBalance.save()
}

export function handleTransfer(event: Transfer): void {
    let id = event.address.toHex() + '#' + event.params.tokenId.toHex();
  
    log.info('Handle transfer: id: {}, address: {}, tokenId: {}', [id, event.address.toString(), event.params.tokenId.toString()]);
  
    let entity = TokenHolder.load(id);
    if (entity == null) {
      entity = new TokenHolder(id);
    }
    entity.contract = event.address;
    entity.tokenId = event.params.tokenId;
    entity.owner = event.params.to;
    entity.save();
    
    // let contract = CryptoKitties.bind(event.address)
    // let tokenBalance = new TokenBalance(event.params.to.toHex());
    // tokenBalance.amount = contract.balanceOf(event.params.to)
    // tokenBalance.totalSupply = contract.totalSupply()
    // tokenBalance.save()
  }
