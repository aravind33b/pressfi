const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { Server, Networks, TransactionBuilder, Operation, Keypair } = require('stellar-sdk');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const secretKey = 'SBVDZVDM4IFPVFAPAQW2ISK3U7GQSSALQJ7JUVIAUHXLG3W4TXJKJFGO';
const sourceKeys = Keypair.fromSecret(secretKey);
const server = new Server('https://horizon-testnet.stellar.org');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

app.post('/upload', async (req, res) => {
    const { url, description, date, time, location, wallet_address, verification_status } = req.body;
    const ipfsHash = url ? url.split('/').pop() : '';

    try {
        const account = await server.loadAccount(sourceKeys.publicKey());
        const timestamp = Date.now().toString();
        const transaction = new TransactionBuilder(account, {
            fee: '100',
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.manageData({ name: `url_${timestamp}`, value: ipfsHash || '' }))
        .addOperation(Operation.manageData({ name: `description_${timestamp}`, value: description ? description.slice(0, 64) : '' }))
        .addOperation(Operation.manageData({ name: `date_${timestamp}`, value: date ? date.toString() : '' }))
        .addOperation(Operation.manageData({ name: `time_${timestamp}`, value: time ? time.toString() : '' }))
        .addOperation(Operation.manageData({ name: `location_${timestamp}`, value: location ? location.slice(0, 64) : '' }))
        .addOperation(Operation.manageData({ name: `wallet_${timestamp}`, value: wallet_address ? wallet_address.toString() : '' }))
        .addOperation(Operation.manageData({ name: `verified_${timestamp}`, value: verification_status ? verification_status.toString() : 'false' }))
        .setTimeout(30)
        .build();

        transaction.sign(sourceKeys);
        const result = await server.submitTransaction(transaction);

        res.status(200).json({ message: 'Transaction successful', result });
    } catch (error) {
        res.status(500).json({ message: 'Transaction failed', error: error.toString() });
    }
});

app.post('/retrieve', async (req, res) => {
    console.log(req.body);
    const { url } = req.body;
    try {
        const account = await server.loadAccount(sourceKeys.publicKey());
        const data = {
            url: Buffer.from(account.data_attr['url'], 'base64').toString('utf-8'),
            description: Buffer.from(account.data_attr['description'], 'base64').toString('utf-8'),
            date: Buffer.from(account.data_attr['date'], 'base64').toString('utf-8'),
            time: Buffer.from(account.data_attr['time'], 'base64').toString('utf-8'),
            location: Buffer.from(account.data_attr['location'], 'base64').toString('utf-8')
        };
        
        res.status(200).json({ message: 'Retrieved Metadata', data });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve metadata', error: error.toString() });
    }
});

app.get('/photos', async (req, res) => {
    try {
        const account = await server.loadAccount(sourceKeys.publicKey());
        const urls = Object.keys(account.data_attr)
            .filter(key => key.startsWith('url_'))
            .map(key => Buffer.from(account.data_attr[key], 'base64').toString('utf-8'));

        const descriptions = Object.keys(account.data_attr)
            .filter(key => key.startsWith('description_'))
            .map(key => Buffer.from(account.data_attr[key], 'base64').toString('utf-8'));

        const dates = Object.keys(account.data_attr)
            .filter(key => key.startsWith('date_'))
            .map(key => Buffer.from(account.data_attr[key], 'base64').toString('utf-8'));

        const times = Object.keys(account.data_attr)
            .filter(key => key.startsWith('time_'))
            .map(key => Buffer.from(account.data_attr[key], 'base64').toString('utf-8'));

        const locations = Object.keys(account.data_attr)
            .filter(key => key.startsWith('location_'))
            .map(key => Buffer.from(account.data_attr[key], 'base64').toString('utf-8'));

        const walletAddresses = Object.keys(account.data_attr)
            .filter(key => key.startsWith('wallet_'))
            .map(key => Buffer.from(account.data_attr[key], 'base64').toString('utf-8'));

        const verificationStatuses = Object.keys(account.data_attr)
            .filter(key => key.startsWith('verified_'))
            .map(key => Buffer.from(account.data_attr[key], 'base64').toString('utf-8') === 'true');

        const metadata = urls.map((url, index) => ({
            url,
            description: descriptions[index],
            date: dates[index],
            time: times[index],
            location: locations[index],
            wallet_address: walletAddresses[index],
            verification_status: verificationStatuses[index],
        }));

        // Remove duplicates
        const uniqueMetadata = Array.from(new Set(metadata.map(JSON.stringify))).map(JSON.parse);

        console.log('Retrieved Metadata:', uniqueMetadata);
        res.status(200).json({ message: 'Retrieved Metadata', metadata: uniqueMetadata });
    } catch (error) {
        console.error('Error retrieving metadata:', error);
        res.status(500).json({ message: 'Failed to retrieve metadata', error: error.toString() });
    }
});

app.post('/buy', async (req, res) => {
    const { image_url, buyer_wallet } = req.body;

    try {
        const account = await server.loadAccount(sourceKeys.publicKey());
        const urlKey = Object.keys(account.data_attr).find(key => Buffer.from(account.data_attr[key], 'base64').toString('utf-8') === image_url);
        const walletAddressKey = urlKey.replace('url_', 'wallet_');
        const seller_wallet = Buffer.from(account.data_attr[walletAddressKey], 'base64').toString('utf-8');

        if (buyer_wallet === seller_wallet) {
            return res.status(400).json({ message: 'Cannot buy your own image' });
        }

        const buyerKeys = Keypair.fromSecret(buyer_wallet);

        const buyerAccount = await server.loadAccount(buyerKeys.publicKey());
        const transaction = new TransactionBuilder(buyerAccount, {
            fee: '100',
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.payment({
            destination: seller_wallet,
            asset: Asset.native(),
            amount: '10' // Example amount
        }))
        .setTimeout(30)
        .build();

        transaction.sign(buyerKeys);
        const result = await server.submitTransaction(transaction);

        // Remove the image from the listing
        const transactionRemove = new TransactionBuilder(account, {
            fee: '100',
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.manageData({ name: urlKey, value: null }))
        .addOperation(Operation.manageData({ name: walletAddressKey, value: null }))
        .setTimeout(30)
        .build();

        transactionRemove.sign(sourceKeys);
        await server.submitTransaction(transactionRemove);

        res.status(200).json({ message: 'Purchase successful', result });
    } catch (error) {
        res.status(500).json({ message: 'Purchase failed', error: error.toString() });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
