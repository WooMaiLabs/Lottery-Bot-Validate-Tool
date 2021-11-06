const crypto = require('crypto')
const fetch = require('make-fetch-happen')

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const lottery_id = argv['id'];
if (!lottery_id) {
    console.log('Usage: node validate.js --id <Lottery ID>')
    process.exit(1)
}

async function main() {
    const result = await fetch(`https://lottery.tg/lottery/${lottery_id}/data`).then(rsp => rsp.json())
    if (result.code !== 0) {
        console.error('Failed to fetch data');
        process.exit(2)
    } else {
        // 获取全部 User Hash
        const hashes = [];
        for (const user of result.data.joined_list) {
            hashes.push(user.hash);
        }

        hashes.sort((a, b) => {
            if (a > b) return -1;
            if (a < b) return 1;
            return 0;
        })

        // console.log(hashes)

        let gift_amount = 0;
        for (const gift of result.data.gifts) {
            gift_amount += gift.amount;
        }

        const seed_msg = result.data.lottery_id + result.data.joined_list.length + gift_amount + '0x' + result.data.block_hash;
        // console.log(seed_msg)
        let seed_hex = crypto.createHash('sha256').update(seed_msg).digest('hex')

        console.log('Initial Seed:', seed_hex);

        let i = 0;
        while (i < gift_amount) {
            const seed = BigInt('0x' + seed_hex)
            const index = seed % BigInt(result.data.joined_list.length)
            // todo: 验证资格
            i++;
            console.log('Lucky Hash:', hashes[index]);

            seed_hex = crypto.createHash('sha256').update(seed_hex).digest('hex')
        }
    }
}


main()
