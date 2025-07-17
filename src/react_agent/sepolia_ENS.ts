// ENS
import { hexlify, parseEther, formatEther, ethers, keccak256, toUtf8Bytes, namehash, Wallet } from 'ethers';
import "dotenv/config";
import ETHRegistrarControllerABI from "../../abis/ETHRegistrarController.json" with { type: 'json'}
import PublicResolverABI from "../../abis/PublicResolver.json" with { type: 'json'}

const PublicResolverAddress = '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5'
const ETHRegistrarControllerAddress = '0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968'

// Importing User Keys from the ENV File
//const alchemyKey = process.env.VITE_ALCHEMY_API_KEY
//const walletPrivateKey: string = "000000000000000000000"

// Creating a Wallet, Provider, and Signe
/*
const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`)
const wallet = new ethers.Wallet(walletPrivateKey, provider);
const signer = wallet.connect(provider)
*/
// Create Contracts
/*
const publicResolver = new ethers.Contract(
  PublicResolverAddress,
  PublicResolverABI.abi,
  signer // provider
)
*/

export async function createEnsSepoliaDeploymentWithMetaMask(ensName: string, mmSigner) {
  const ethRegistrarController = new ethers.Contract(
    ETHRegistrarControllerAddress,
    ETHRegistrarControllerABI.abi,
    mmSigner
  )
  console.log('Signer: ', mmSigner)
  if (!ensName.includes('.eth')) {
    return console.log('This name does not include ".eth". which is necessary. Please add and try again.')
  }
  console.log('Registering ENS domain name...')
  const name = ensName
  const duration = 31536000 // 60 * 60 * 24 * 365
  const secret = hexlify(ethers.randomBytes(32))
  console.log('Name: ', name)
  console.log('Duration: ', duration)
  console.log('Secret: ', secret)
  console.log(`Creating domain name for ${name}.eth...`)
  const response = createName()
  async function createName() {
    const registrationObject = {
      label: name,
      owner: mmSigner.address, // Your personal wallet is now the owner
      duration: duration,
      secret: secret,
      resolver: PublicResolverAddress, // '0x0000000000000000000000000000000000000000' = null, meaning no resolver is set
      data: [],
      reverseRecord: 1, // 0 reverse record flag set to 0
      referrer: '0x0000000000000000000000000000000000000000000000000000000000000000'
    }
    console.log('Registration Object: ', registrationObject)
    console.log('ETH Registrar Controller: ', ethRegistrarController)
    const commitment = await ethRegistrarController.makeCommitment(registrationObject)
    console.log('Commitment: ', commitment)
    console.log('Sending commit...')
    console.log('Sending commit...')
    const tx1 = await ethRegistrarController.commit(commitment)
    await tx1.wait()
    console.log('Commit sent. Waiting 60 seconds...')
    console.log('Commit sent. Waiting 60 seconds...')
    await new Promise ((r) => setTimeout(r, 60000))
    console.log('Waited 60 seconds!')
    console.log('Waited 60 seconds!')
    console.log('Registering...')
    console.log('Registering...')
    const tx2 = await ethRegistrarController.register(registrationObject, {
      value: BigInt('3125000000003490') // 0.003125 ETH
    })
    await tx2.wait()
    // ENS Domain Name Created Successfully
    console.log(`ENS name "${name}.eth" registered!`)
    console.log(`ENS name "${name}.eth" registered!`)
    console.log(`See ENS profile here: https://sepolia.app.ens.domains/${name}.eth`)
    console.log(`See ENS profile here: https://sepolia.app.ens.domains/${name}.eth`)
  }
  return response
}

