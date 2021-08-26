/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
import { CONFIG } from '../config';

import { ArtVoteWrapper } from '../lib/contracts/ArtVoteWrapper';
import { ARTVOTE_CONTRACT_ADDRESS } from './utils';

const ARTS = [
    { id: 1, url: 'https://oggusto.com/UserFiles/Image/images/Temmuz2019/van-gogh-6.jpg' },
    {
        id: 2,
        url:
            'https://www.tarihiolaylar.com/dvsthumb.php?src=/img/galeri/galeri_noon-rest-from-work-after-millet-jpg_688813015_1429193707.jpg&w=740'
    },
    {
        id: 3,
        url:
            'https://www.sanatperver.com/content/images/wordpress/2020/11/arlesteki-yatak-odasi-van-gogh-scaled.jpg'
    }
];

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };
        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

interface Art {
    artId: number;
    votes: number;
}
export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<ArtVoteWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [selectedArtId, setSelectedArtId] = useState<number>();
    const [arts, setArts] = useState<Art[]>();
    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    useEffect(() => {
        if (contract && web3 && accounts) {
            getAllVotes();
        }
    }, [contract, web3, accounts]);

    async function getAllVotes() {
        const artlist = [];
        for (let i = 1; i <= 3; i++) {
            const art = await getArt(i);
            artlist.push(art);
        }
        setArts(artlist);
        toast('Updated all the art votes 🎨', { type: 'success' });
    }
    const account = accounts?.[0];

    async function getArt(id: number) {
        const art = await contract.getArt(id, account);

        return { artId: Number(art.artId), votes: Number(art.votes) };
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new ArtVoteWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredValue(undefined);
    }

    async function voteArt(e: any) {
        try {
            setTransactionInProgress(true);
            await contract.voteArt(Number(e.target.id), account);
            toast('Successfully voted', { type: 'success' });
            setArts(undefined);
            await getAllVotes();
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });
            const _contract = new ArtVoteWrapper(_web3);
            setContract(_contract);
            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div className="app">
            <h1> 🎨 Vote Van Gogh</h1>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{ARTVOTE_CONTRACT_ADDRESS}</b> <br />
            <br />
            <br />
            <br />
            <hr />
            {ARTS.map(art => (
                <div key={art.id} className="art">
                    {' '}
                    <div>
                        {' '}
                        Total Vote:{' '}
                        <b>
                            {arts && arts.length > 1 ? (
                                arts?.[art.id - 1].votes
                            ) : (
                                <LoadingIndicator />
                            )}
                        </b>{' '}
                    </div>
                    <img alt="art" src={art.url} />
                    <br />
                    <button id={art.id.toString()} onClick={voteArt}>
                        🎨 Vote
                    </button>
                </div>
            ))}
            <ToastContainer />
        </div>
    );
}
