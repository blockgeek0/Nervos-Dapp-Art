import Web3 from 'web3';
import * as ArtVoteJSON from '../../../build/contracts/ArtVote.json';
import { ArtVote } from '../../types/ArtVote';
import { ARTVOTE_CONTRACT_ADDRESS } from '../../ui/utils';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};
export class ArtVoteWrapper {
    web3: Web3;

    contract: ArtVote;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(ArtVoteJSON.abi as any) as any;
        this.useDeployed(ARTVOTE_CONTRACT_ADDRESS);
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getArt(id: number, fromAddress: string) {
        const art = await this.contract.methods.arts(id).call({ from: fromAddress });

        return art;
    }

    async voteArt(id: number, fromAddress: string) {
        const tx = await this.contract.methods.sendVote(id).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
