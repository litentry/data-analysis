import { log, BigInt } from '@graphprotocol/graph-ts';
import { TokenHolder } from "../../generated/schema";
import {
  Transfer
} from '../../generated/BFH_Unit/BFH_Unit';

export function handleTransfer(event: Transfer): void {
  let id = event.address.toHex() + '#' + event.params._tokenId.toHex();

  log.info('Handle transfer: id: {}, address: {}, tokenId: {}', [id, event.address.toString(), event.params._tokenId.toString()]);

  let entity = TokenHolder.load(id);
  if (entity == null) {
    entity = new TokenHolder(id);
  }

  entity.contract = event.address;
  entity.tokenId = event.params._tokenId;
  entity.owner = event.params._to;

  entity.save();
  
  // let contract = ERC721.bind(event.address)
  // let tokenBalance = new TokenBalance(event.params._to.toHex());
  // tokenBalance.amount = contract.balanceOf(event.params._to)
  // tokenBalance.totalSupply = contract.totalSupply()
  // tokenBalance.save()
}
