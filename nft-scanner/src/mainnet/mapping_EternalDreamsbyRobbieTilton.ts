import { log, BigInt } from '@graphprotocol/graph-ts';
import { TokenHolder } from "../../generated/schema";
import {
  Transfer, NiftyCreated
} from '../../generated/EternalDreamsbyRobbieTilton/EternalDreamsbyRobbieTilton';

export function handleNiftyCreated(event: NiftyCreated): void {
  let id = event.address.toHex() + '#' + event.params._tokenId.toHex();
  let entity = new TokenHolder(id);
  entity.contract = event.address;
  entity.tokenId = event.params._tokenId;
  entity.owner = event.params.new_owner;
  entity.save();
}

export function handleTransfer(event: Transfer): void {
  let id = event.address.toHex() + '#' + event.params.tokenId.toHex();

  log.info('[EternalDreamsbyRobbieTilton] Handle transfer: id: {}, address: {}, tokenId: {}', [id, event.address.toString(), event.params.tokenId.toString()]);

  let entity = TokenHolder.load(id);
  if (entity == null) {
    entity = new TokenHolder(id);
  }

  entity.contract = event.address;
  entity.tokenId = event.params.tokenId;
  entity.owner = event.params.to;

  entity.save();
}
