const { assert } = require("chai");

const tokenProxyFactoryAddress = "0xE4E9cDB3E139D7E8a41172C20b6Ed17b6750f117";

describe("farming potatoes", function() {
  let stake, potato;
  let address0, signer0, potatoWhale;
  let tokenFaucet;
  beforeEach(async () => {
    signer0 = await ethers.getSigner(0);
    address0 = await signer0.getAddress();

    const signer1 = await ethers.getSigner(1);
    potatoWhale = await signer1.getAddress();

    const Potato = await ethers.getContractFactory("Potato");
    potato = await Potato.deploy(1000);
    await potato.deployed();

    const stakeAddress = ethers.utils.getContractAddress({
      from: address0,
      nonce: (await ethers.provider.getTransactionCount(address0)) + 1,
    });

    const proxyFactory = await ethers.getContractAt("ITokenFaucetProxyFactory", tokenProxyFactoryAddress);
    const tx = await proxyFactory.create(potato.address, stakeAddress, 1);
    const receipt = await tx.wait();

    const tokenFaucetAddress = receipt.events[0].data.slice(-40);
    tokenFaucet = await ethers.getContractAt("ITokenFaucet", tokenFaucetAddress);

    const Stake = await ethers.getContractFactory("Stake");
    stake = await Stake.deploy(1000, tokenFaucet.address);
    await stake.deployed();

    await stake.transfer(potatoWhale, 750);
  });

  it("should have a balance of potatoes", async function() {
    const balance = await potato.balanceOf(address0);
    assert(balance.eq(1000));
  });

  it("should have a balance of stake", async function() {
    const balance = await stake.balanceOf(address0);
    assert(balance.eq(250));
  });

  describe("after depositing potatoes", () => {
    beforeEach(async () => {
      await potato.approve(tokenFaucet.address, 1000);
      await tokenFaucet.deposit(1000);

      await hre.network.provider.request({
        method: "evm_increaseTime",
        params: [300],
      });

      await tokenFaucet.claim(address0);
      await tokenFaucet.claim(potatoWhale);
    });

    it("should have 700 potatoes in the faucet", async () => {
      const balance = await potato.balanceOf(tokenFaucet.address);
      assert(balance.eq(700));
    });

    it("should have 75 potatoes in address0", async () => {
      const balance = await potato.balanceOf(address0);
      assert(balance.eq(75));
    });

    it("should have 225 potatoes in potatoWhale", async () => {
      const balance = await potato.balanceOf(potatoWhale);
      assert(balance.eq(225));
    });
  });
});
