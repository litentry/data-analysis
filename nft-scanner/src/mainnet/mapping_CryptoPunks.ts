import { log, BigInt } from '@graphprotocol/graph-ts';
import { TokenHolder } from "../../generated/schema";
import {
  PunkTransfer
} from '../../generated/CryptoPunks/CryptoPunks';

export function handleTransfer(event: PunkTransfer): void {
  let id = event.address.toHex() + '#' + event.params.punkIndex.toHex();

  log.info('[CryptoPunks] Handle transfer: id: {}, address: {}, tokenId: {}', [id, event.address.toString(), event.params.punkIndex.toString()]);

  let entity = TokenHolder.load(id);
  if (entity == null) {
    entity = new TokenHolder(id);
  }

  entity.contract = event.address;
  entity.tokenId = event.params.punkIndex;
  entity.owner = event.params.to;

  entity.save();
}
