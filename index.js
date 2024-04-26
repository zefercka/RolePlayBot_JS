const Discord = require('discord.js'); 
const mysql = require('mysql');
const fs = require('fs');
const Canvas = require('canvas');

const bot = new Discord.Client();
let config = require('./botconfig.json'); 
const { count } = require('console');
let token = config.token
let prefix = config.prefix;

const blackjackChannels = ['🃏блэкджек-1🃏', '🃏блэкджек-2🃏', '🃏блэкджек-3🃏', '🃏блэкджек-4🃏']
const cards = [{name: '2_T', id: '809046755638247455'}, {name: '2_B', id: '809041956747477022'}, {name: '2_C', id: '809041529905086504'}, {name: '2_P', id: '809046304369016842'}, 
             {name: '3_T', id: '809047632923590676'}, {name: '3_B', id: '809044342873784361'}, {name: '3_C', id: '809043709500719124'}, {name: '3_P', id: '809044788333510696'},
             {name: '4_T', id: '809048023556161567'}, {name: '4_B', id: '809045496831148062'}, {name: '4_C', id: '809044788191821834'}, {name: '4_P', id: '809043709483286539'},
             {name: '5_T', id: '809044342773252127'}, {name: '5_B', id: '809047632928440342'}, {name: '5_C', id: '809045868359319603'}, {name: '5_P', id: '809041239118315520'},
             {name: '6_T', id: '809043709681074226'}, {name: '6_B', id: '809044788213055518'}, {name: '6_C', id: '809044342978642000'}, {name: '6_P', id: '809045496672026654'},
             {name: '7_T', id: '809498271260737596'}, {name: '7_B', id: '809044787864535063'}, {name: '7_C', id: '809045496324161567'}, {name: '7_P', id: '809041956666605591'},
             {name: '8_T', id: '809041957119721472'}, {name: '8_B', id: '809046755789897768'}, {name: '8_C', id: '809047632939974666'}, {name: '8_P', id: '809045496203051029'},
             {name: '9_T', id: '809044787973586944'}, {name: '9_B', id: '809044788438499398'}, {name: '9_C', id: '809048522984128552'}, {name: '9_P', id: '809048292029104178'},
             {name: '0_T', id: '809043960323375154'}, {name: '0_B', id: '809041956784308225'}, {name: '0_C', id: '809497637190631474'}, {name: '0_P', id: '809041956721524736'},
             {name: 'J_T', id: '809046304302956572'}, {name: 'J_B', id: '809047145217916929'}, {name: 'J_C', id: '809048820000096318'}, {name: 'J_P', id: '809046755357622294'},
             {name: 'Q_T', id: '809041337671876618'}, {name: 'Q_B', id: '809047145113583648'}, {name: 'Q_C', id: '809043960416043008'}, {name: 'Q_P', id: '809047145113583648'},
             {name: 'K_T', id: '809042411896307732'}, {name: 'K_B', id: '809041700638687252'}, {name: 'K_C', id: '809045868765380648'}, {name: 'K_P', id: '809040995214819348'},
             {name: 'A_T', id: '809044342873522197'}, {name: 'A_B', id: '809042411791056915'}, {name: 'A_C', id: '809045868413059113'}, {name: 'A_P', id: '809045867997954154'}
            ];
var drivingschool = [];

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "10021984Rt!",
    database: "server"
});

con.connect(err =>{
    if (err) throw err;
    console.log("Connect to database");
});

function generateMoney(maxMoney, minMoney, maxLevel, minLevel, msg, method){
    let moneyAdd = Math.floor(Math.random() * (maxMoney - minMoney + 1)) + minMoney;
    con.query(`SELECT * FROM moneys WHERE id = '${msg.author.id}'`, (err, rows) => {
        if (method === 'hand'){
            if (err) throw err;
            let money = Number(rows[0].money);
            money = (money + moneyAdd);
            moneyEdit('+', moneyAdd, msg, 'hand')
            let sql = `UPDATE moneys SET money = '${money}' WHERE id = '${msg.author.id}'`;
            con.query(sql);
        }
        else{
            if (err) throw err;
            let bank = Number(rows[0].money);
            bank = (bank + moneyAdd);
            moneyEdit('+', moneyAdd, msg, 'bank')
            let sql = `UPDATE moneys SET money = '${bank}' WHERE id = '${msg.author.id}'`;
            con.query(sql);
        };
    });

    let xpAdd = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
    con.query(`SELECT * FROM xp WHERE id = '${msg.author.id}'`, (err, rows) => {
        if (err) throw err;
        let xp = rows[0].xp;
        let level = rows[0].level;

        if (levelCheck(xp, level) > level){
            let sql = `UPDATE xp SET level = '${levelCheck(xp, level)}' WHERE id = '${msg.author.id}'`;
            con.query(sql);

            let Role = msg.guild.roles.cache.find(role => role.name === `Уровень ${level+1}`);
            let user = msg.guild.members.cache.get(`${msg.author.id}`)
            user.roles.add(Role).catch(console.error);

            Role = msg.guild.roles.cache.find(role => role.name === `Уровень ${level}`);
            user.roles.remove(Role).catch(console.error);

            sql = `UPDATE xp SET xp = '${(xp + xpAdd) - (level + 1) * 1000}' WHERE id = '${msg.author.id}'`;
            con.query(sql);
        }
        else{
            let sql = `UPDATE xp SET xp = '${xp + xpAdd}' WHERE id = '${msg.author.id}'`;
            con.query(sql);
        }
    })
}

function levelCheck(xp, level){
    if (xp >= (level+1)*1000){
        level = level + 1;
        return level
    }
    else{
        return level;
    }
}

function moneySort(money){
    decPlaces = Math.pow(10, 2);
    var abbrev = [ "k", "m", "b", "t" ];

    if (money > 999 && money < 1000000){
        money = (money / 1000).toFixed(2) + 'K'
    }
    else if (money > 999999 && money < 1000000000){
        money = (money / 1000).toFixed(2) + 'M'
    }
    return money;
}

function moneyEdit(sign, edit, msg, method){
    con.query(`SELECT * FROM moneys WHERE id = '${msg.author.id}'`, (err, rows) => {
        if (err) throw err;
        let money = Number(rows[0].money);
        let bank = Number(rows[0].bank)
        if (method === 'hand'){
            if (sign === '+'){
                let emb = new Discord.MessageEmbed()
                    .setColor('#66bb6a')
                    .setTimestamp()
                    .setDescription(`**Имя:** ${msg.author} \n **Наличные:** +$${moneySort(edit)} | $${moneySort(money + edit)} \n **Банк:** $0 | $${moneySort(bank)}\n **Чат:** ${msg.channel}`)
                    .setAuthor('Изменение баланса', 'https://media.discordapp.net/attachments/807692029692870698/812309032719220747/update_2.png');
                logChannel = bot.channels.cache.get('594060555518476329');
                logChannel.send(emb);
                let sql = `UPDATE moneys SET money = ${money + edit} WHERE id = ${msg.author.id}`;
                con.query(sql);
            }
            else{
                let emb = new Discord.MessageEmbed()
                .setColor('#ef5350')
                .setTimestamp()
                .setDescription(`**Имя:** ${msg.author} \n **Наличные:** -$${moneySort(edit)} | $${moneySort(money - edit)} \n **Банк:** $0 | $${moneySort(bank)}\n **Чат:** ${msg.channel}`)
                .setAuthor('Изменение баланса', 'https://media.discordapp.net/attachments/807692029692870698/812309032719220747/update_2.png');
            logChannel = bot.channels.cache.get('594060555518476329');
            logChannel.send(emb);
            let sql = `UPDATE moneys SET money = ${money - edit} WHERE id = ${msg.author.id}`;
            con.query(sql);
            };
        }
        else{
            if (sign === '+'){
                let emb = new Discord.MessageEmbed()
                    .setColor('#66bb6a')
                    .setTimestamp()
                    .setDescription(`**Имя:** ${msg.author} \n **Наличные:** $0 | $${moneySort(money)} \n **Банк:** +$${moneySort(edit)} | $${moneySort(bank + edit)}\n **Чат:** ${msg.channel}`)
                    .setAuthor('Изменение баланса', 'https://media.discordapp.net/attachments/807692029692870698/812309032719220747/update_2.png');
                logChannel = bot.channels.cache.get('594060555518476329');
                logChannel.send(emb);
                let sql = `UPDATE moneys SET bank = ${bank + edit} WHERE id = ${msg.author.id}`;
                con.query(sql);
            }
            else{
                let emb = new Discord.MessageEmbed()
                    .setColor('#ef5350')
                    .setTimestamp()
                    .setDescription(`**Имя:** ${msg.author} \n **Наличные:** $0 | $${moneySort(money)} \n **Банк:** -$${moneySort(edit)} | $${moneySort(bank - edit)}\n **Чат:** ${msg.channel}`)
                    .setAuthor('Изменение баланса', 'https://media.discordapp.net/attachments/807692029692870698/812309032719220747/update_2.png');
                logChannel = bot.channels.cache.get('594060555518476329');
                logChannel.send(emb);
                let sql = `UPDATE moneys SET bank = ${bank - edit} WHERE id = ${msg.author.id}`;
                con.query(sql);
            };
        };
    });
};

function cards_count(cards_player){
    let value = 0
    for (let i = 0; i < cards_player.length; i++){
        let value_card = parseInt((cards_player[i].name).match(/\d+/))
        if (value_card > 0){
            value += value_card
        }
        else if(value_card == 0){
            value += 10
        }
        else{
            if ((cards_player[i].name).indexOf('A') !== -1){
                if ((value + 11) > 21) {
                    value += 1
                }
                else {
                    value += 11
                };
            }
            else{
                if ((value + 10) > 21 && (cards_player[i].name).indexOf('A') !== -1) {
                    value = value
                }
                else {
                    value += 10
                };
            };
        };
    };
    return (value)
};

async function SlutStart(message, react, user){
    if (react.emoji.name == '🙋‍♀️'){
        await message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        await message.react('🤝')
        let filter = ((react, author) => (react.emoji.name == '🤝' && author.id == user.id));
        await collectorSlut(filter, message);
        return;
    }
    else if (react.emoji.name == '🤝'){
        await message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        await message.react('🙌')
        let filter = ((react, author) => (react.emoji.name == '🙌' && author.id == user.id));
        await collectorSlut(filter, message);
        return;
    }
    else if (react.emoji.name == '🙌'){
        await message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        await message.react('🔽')
        let filter = ((react, author) => (react.emoji.name == '🔽' && author.id == user.id));
        await collectorSlut(filter, message);
        return;
    }
};

async function collectorSlut(filter, message){
    const dsCollectorSlut = await message.createReactionCollector(filter, {time: 5000});

    dsCollectorSlut.on('collect', async (react, user) => {
        await SlutStart(message, react, user);
        return;
    });

    dsCollectorSlut.on('end', async collected => {
        if (collected.size == 0){
            console.log(collected.size)
            message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        };
    });
};

async function QuestionsDriving(msg, message, question, answered){
    await message.delete();
    if (answered == true){
        drivingschool.forEach(drs => {
            if (drs.id == msg.author.id){
                drs.question += 1;
                drs.answer += 1;
            };
        });
    } else {
        drivingschool.forEach(drs => {
            if (drs.id == msg.author.id){
                drs.question += 1;
            };
        });
    };
    if (question == 1){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 1** \n
                            *Максимальная скорость движения разрешённая в жилой зоне?* \n
                            1) 30 км/ч \n
                            2) 20 км/ч \n
                            3) 25 км/ч \n`);
    }
    else if (question == 2){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 2** \n
                            *Разрешён ли обгон через сплошную?* \n
                            1) Да. \n
                            2) Если нет встречного автомобиля. \n
                            3) Нет. \n`);
    }
    else if (question == 3){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 3** \n
                            *Как Вам следует поступить в данной ситуации?* \n
                            1) Уступить дорогу встречному автомобилю. \n
                            2) Проехать первым. \n
                            3) Действовать по взаимной договоренности с водителем встречного автомобиля. \n`)
            .setImage('https://i.imgur.com/TMYJyHg.jpg');
    }
    else if (question == 4){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 4** \n
                            *Можно ли Вам въехать на мост первым?* \n
                            1) Можно. \n
                            2) Можно, если Вы не затрудните движение встречному автомобилю. \n
                            3) Нельзя. \n`)
            .setImage('https://i.imgur.com/fKXnGaq.jpg');
    }
    else if (question == 5){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 5** \n
                            *Разрешено ли Вам обогнать мотоцикл?* \n
                            1) Разрешено. \n
                            2) Запрещено. \n
                            3) Разрешено, если водитель мотоцикла снизил скорость. \n`)
            .setImage('https://i.imgur.com/byOqvZm.jpg');
    }
    else if (question == 6){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 6** \n
                            *Разрешается ли водителю выполнить объезд грузового автомобиля?* \n
                            1) Разрешается. \n
                            2) Запрещается. \n
                            3) Разрешается, если между шлагбаумом и остановившимся грузовым автомобилем расстояние более 5 м. \n`)
            .setImage('https://i.imgur.com/GhLcVTe.jpg');
    }
    else if (question == 7){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 7** \n
                            *Что следует предпринять водителю для предотвращения опасных последствий
                            заноса автомобиля при резком повороте рулевого колеса на скользкой дороге?* \n
                            1) Быстро, но плавно повернуть рулевое колесо в сторону заноса, затем опережающим
                            воздействием на рулевое колесо выровнять траекторию движения автомобиля. \n
                            2) Выключить сцепление и повернуть рулевое колесо в сторону заноса. \n
                            3) Нажать на педаль тормоза и воздействием на рулевое колесо выровнять траекторию движения. \n`);
    }
    else if (question == 8){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 8** \n
                            *При движении в условиях недостаточной видимости можно использовать противотуманные фары:* \n
                            1) Только отдельно от ближнего или дальнего света фар. \n
                            2) Только совместно с ближним или дальним светом фар. \n
                            3) Как отдельно, так и совместно с ближним или дальним светом фар. \n`);
    }
    else if (question == 9){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 9** \n
                            *Разрешается ли водителю пользоваться телефоном во время движения?* \n
                            1) Запрещается. \n
                            2) Разрешается. \n
                            3) Разрешается только при использовании технического устройства, позволяющего
                            вести переговоры без использования рук.  \n`);
    }
    else if (question == 10){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 10** \n
                            *Вы можете начать обгон:* \n
                            1) На переезде. \n
                            2) Через 100 м после переезда. \n
                            3) Непосредственно после переезда. \n`)
            .setImage('https://i.imgur.com/U21sqdK.jpg');
    }
    else if (question == 11){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 11** \n
                            *Вы намерены проехать перекресток в прямом направлении. В данной ситуации:* \n
                            1) Вы обязаны уступить дорогу грузовому автомобилю. \n
                            2) Вы имеете право проехать перекресток первым. \n
                            3) Вы обязаны уступить дорогу если вес грузового автомобиля более 3.5 т.`)
            .setImage('https://i.imgur.com/sEx38Cr.jpg');
    }
    else if (question == 12){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 12** \n
                            *Разрешено ли водителю грузового автомобиля остановиться в этом месте?* \n
                            1) Разрешено. \n
                            2) Разрешено, если разрешенная максимальная масса автомобиля не более 3,5 т. \n
                            3) Запрещено. \n`)
            .setImage('https://i.imgur.com/KcfVQAj.jpg');
    }
    else if (question == 13){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 13** \n
                            *В данной ситуации водитель автомобиля с включенными проблесковыми маячками:* \n
                            1) Должен ожидать разрешающего сигнала светофора. \n
                            2) Может двигаться только прямо или направо. \n
                            3) Может двигаться в любом направлении. \n`)
            .setImage('https://i.imgur.com/6Wbsoy1.jpg');
    }
    else if (question == 14){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 14** \n
                            *Водители должны уступать дорогу другим участникам движения:* \n
                            1) При выезде из жилой зоны. \n
                            2) При выезде с дворовой территории. \n
                            3) В обоих перечисленных случаях. \n`);
    }
    else if (question == 15){
        var emb = new Discord.MessageEmbed()
            .setColor('#81bdff')
            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
            .setTitle(`Автошкола`)
            .setDescription(`**Вопрос 15** \n
                            *Допускается ли применять шторки и жалюзи на заднем стекле легкового автомобиля?* \n
                            1) Допускается. \n
                            2) Допускается только при наличии зеркал заднего вида с обеих сторон. \n
                            3) Не допускается. \n`);
    }
    else {
        let answer = drivingschool.find(drc => drc.id == msg.author.id).answer
        if (answer >= 12){
            var emb = new Discord.MessageEmbed()
                .setColor('#66bb6a')
                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                .setTitle(`Автошкола`)
                .setDescription(`Вы успешно сдали теоретический экзамен набрав ${answer} баллов. Теперь вы можете управлять автомобилем.`);
            let messages = await message.channel.send(emb);
            let Role = msg.guild.roles.cache.find(role => role.name === `Права`);
            let user = msg.guild.members.cache.get(`${msg.author.id}`)
            user.roles.add(Role).catch(console.error);
            messages.delete({timeout: 15000});
            let sql = `UPDATE documents SET driving = 'Yes' WHERE id = '${msg.author.id}'`;
            con.query(sql);
            drivingschool.splice(drivingschool.indexOf(drc => drc.id == msg.author.id), 1);
            return;
        }
        else {
            var emb = new Discord.MessageEmbed()
                .setColor('#ef5350')
                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                .setTitle(`Автошкола`)
                .setDescription(`**Вы провалили экзамен**
                                 Вы набрали всего ${answer} баллов.`);
            let messages = await message.channel.send(emb);
            messages.delete({timeout: 15000});
            drivingschool.splice(drivingschool.indexOf(drc => drc.id == msg.author.id), 1);
            return;
        };
    }

    let messages = await message.channel.send(emb);
    await messages.react('1️⃣')
    await messages.react('2️⃣')
    await messages.react('3️⃣')

    let filters = ((react, user) => (react.emoji.name == '1️⃣' || react.emoji.name == '2️⃣' || react.emoji.name == '3️⃣' && user.id == msg.author.id));
    await collectorDrivingSchool(messages, filters, msg);
};

async function collectorDrivingSchool(message, filter, msg){
    const dsCollector = await message.createReactionCollector(filter, {time: 25000});

    dsCollector.on('collect', async (react, user) => {
        let question = drivingschool.find(drc => drc.id == `${msg.author.id}`).question;
        switch(react.emoji.name){
            case ('1️⃣'):
                if (question == 3){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else if(question == 4){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else if (question == 7){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else if (question == 12){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else {
                    QuestionsDriving(msg, message, question + 1, false)
                    break
                }

            case ('2️⃣'):
                if (question == 1){
                    QuestionsDriving(msg, message, question + 1, true)
                }
                else if (question == 5){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                } 
                else if (question == 6){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else if (question == 8){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else if (question == 11){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else if (question == 15){
                    QuestionsDriving(msg, message, question + 1, false)
                    break
                }
                else {
                    QuestionsDriving(msg, message, question + 1, false)
                    break
                }
        
            case ('3️⃣'):
                if (question == 2){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                } 
                else if (question == 9){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else if (question == 10){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else if (question == 13){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else if (question == 14){
                    QuestionsDriving(msg, message, question + 1, true)
                    break
                }
                else {
                    QuestionsDriving(msg, message, question + 1, false)
                    break
                };
        };
    }); 

    dsCollector.on('end', async collected => {
        if (collected.size == 0){
            let emb = new Discord.MessageEmbed()
                .setColor('#ec2925')
                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                .setTitle('Автошкола')
                .setDescription(`**Вы провалили экзамен.**
                                 Вы не успели ответить на вопрос за указанное время.
                                 Часть средств была возвращена на ваш счёт.`);
            message.delete()
            drivingschool.splice(drivingschool.indexOf(drc => drc.id == msg.author.id), 1);
            let messages = await msg.author.send(emb)
            con.query(`SELECT * FROM moneys WHERE id = '${msg.author.id}'`, async (err, rows) => {
                let sql = `UPDATE moneys SET money = '${Number(rows[0].money) + 4000}' WHERE id = '${msg.author.id}'`;
                con.query(sql);
            });
            messages.delete({timeout: 15000})
        };
    });
};

bot.on('ready', () => { 
    console.log(`Запустился бот ${bot.user.username}`);
});


bot.on('message', async msg => {
    if (msg.channel.name != 'лог-канал') {
        console.log(`${msg.channel.name} | ${msg.author.username}: ${msg.content}`)
    }

    if (msg.channel.name === '⚒лесорубка⚒' || msg.channel.name === '📬курьер📬' || msg.channel.name === '📦грузчик📦') {
        msg.delete();
        generateMoney(50, 10, 1, 1, msg, 'hand');

    }

    if (msg.channel.name === 'вокзал🚂'){
        let sql = `DELETE FROM xp WHERE id='${msg.author.id}'`
        con.query(sql);
        sql = `DELETE FROM moneys WHERE id='${msg.author.id}'`
        con.query(sql);
        sql = `DELETE FROM documents WHERE id='${msg.author.id}'`
        con.query(sql);
        sql = `DELETE FROM vehicles WHERE id='${msg.author.id}'`
        con.query(sql);
        sql = `DELETE FROM housing WHERE id='${msg.author.id}'`
        con.query(sql);

        sql = `INSERT INTO xp (id, xp, level) VALUES ('${msg.author.id}', ${0}, ${0})`
        con.query(sql);

        sql = `INSERT INTO moneys (id, money, bank) VALUES ('${msg.author.id}', ${100}, ${-1})`
        con.query(sql);

        sql = `INSERT INTO documents (id, passport, driving) VALUES ('${msg.author.id}', 'No', 'No')`
        con.query(sql);

        sql = `INSERT INTO vehicles (id, one, two, three) VALUES ('${msg.author.id}', 'No', 'No', 'No')`
        con.query(sql);

        sql = `INSERT INTO housing (id, one, two) VALUES ('${msg.author.id}', 'No', 'No')`
        con.query(sql);
    }

    if (msg.channel.name === '🏫мэрия🏫'){
        if ((msg.content).toUpperCase() == 'инфо'.toUpperCase() || (msg.content).toUpperCase() == 'информация'.toUpperCase()){
            msg.delete();
            con.query(`SELECT * FROM xp WHERE id = '${msg.author.id}'`, async (err, rows) => {
                if (err) throw err;
                let level = rows[0].level;
                let xp = rows[0].xp;

                con.query(`SELECT * FROM documents WHERE id = '${msg.author.id}'`, async (err, rows) => {
                    if (err) throw err;
                    let  passport = rows[0].passport;
                    let driving = rows[0].driving;

                    
                    con.query(`SELECT * FROM housing WHERE id = '${msg.author.id}'`, async (err, rows) => {
                        if (err) throw err;
                        let houseOne = rows[0].one;
                        let houseTwo = rows[0].two;

                        let canvas = Canvas.createCanvas(1920, 1080);
                        let ctx = canvas.getContext('2d');
                        let bgPhoto = await Canvas.loadImage('./CityHallHUD.png');
                        ctx.drawImage(bgPhoto, 0, 0, canvas.width, canvas.height);
                        ctx.font = '60px Comic Sans MS';
                        ctx.fillStyle = '#5164aa';
                        ctx.fillText(msg.author.tag, 520, 245);
                        ctx.fillText(level, 688, 405);
                        ctx.fillText(`${xp} / ${(level + 1) * 1000}`, 580, 522);
                        if (passport == 'No'){
                            ctx.fillText('Нет', 710, 630)
                        } else {
                            ctx.fillText('Есть', 710, 630)
                        };

                        if (driving == 'No'){
                            ctx.fillText('Нет', 1060, 750)
                        } else {
                            ctx.fillText('Есть', 1060, 750)
                        };

                        if (houseOne == 'No' && houseTwo == 'No'){
                            ctx.fillText('Нет', 740, 870)
                        } else {
                            ctx.fillText('Есть', 740, 870)
                        };

                        let attachemnt = await new Discord.MessageAttachment(canvas.toBuffer(), 'CityHall.png');
                        let message = await msg.channel.send(attachemnt);
                        await message.delete({timeout: 15000})
                    });
                });
            });
        }
        else {
            if (msg.author.tag != 'RolePlayBot#2587'){
                msg.delete();
            };
        };
    };

    if (msg.channel.name === '📒паспортный-стол📒'){
        if (msg.author.tag != 'RolePlayBot#2587'){
            msg.delete()
        }
        else{
            msg.delete({timeout: 5000})
        }
        if (msg.content.toUpperCase() === 'сделать паспорт'.toUpperCase()){
            con.query(`SELECT * FROM documents WHERE id = '${msg.author.id}'`, (err, rows) => {
                if (err) throw err;
                let passport = rows[0].passport;
                if (passport === 'Yes'){
                    let emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setDescription(`${msg.author.username}, у вас уже есть паспорт.`);
                    msg.channel.send(emb)
                }
                else{
                    con.query(`SELECT * FROM moneys WHERE id = '${msg.author.id}'`, (err, rows) => {
                        if (err) throw err;
                        let money = rows[0].money;
                        if (money >= 1000){
                            let emb = new Discord.MessageEmbed()
                                .setColor('#66bb6a')
                                .setTitle(msg.author.tag)
                                .setDescription(`${msg.author.username}, ваш паспорт будет готов через 5 минут.`);
                            msg.channel.send(emb);

                            moneyEdit('-', 1000, msg, 'hand')

                            let sql = (`UPDATE documents SET passport = 'Wait' WHERE id = '${msg.author.id}'`)
                            con.query(sql)
                        }
                        else{
                            emb = new Discord.MessageEmbed()
                                .setColor('#ec2925')
                                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                .setTitle('Операция не выполнена, недостаточно средств!');
                            msg.channel.send(emb);
                        }
                    });
                }
            });
        }
        else if(msg.content.toUpperCase() === 'активировать паспорт'.toUpperCase()){
            con.query(`SELECT * FROM documents WHERE id = '${msg.author.id}'`, (err, rows) => {
                if (err) throw err;
                let passport = rows[0].passport
                if (passport === 'Wait'){
                    let emb = new Discord.MessageEmbed()
                        .setColor('#66bb6a')
                        .setTitle(msg.author.tag)
                        .setDescription(`${msg.author.username}, ваш паспорт активирован.`);
                    msg.channel.send(emb);

                    let Role = msg.guild.roles.cache.find(role => role.name === `Паспорт`);
                    let user = msg.guild.members.cache.get(`${msg.author.id}`)
                    user.roles.add(Role).catch(console.error);

                    let sql = `UPDATE documents SET passport = 'Yes' WHERE id = '${msg.author.id}'`;
                    con.query(sql);
                }
                else if(passport === 'No'){
                    let emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setDescription(`${msg.author.username}, вы ещё не сделали паспорт. \n Чтобы сделать паспорт напишите: **Сделать паспорт**.`);
                    msg.channel.send(emb);
                }
                else{
                    let emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setDescription(`${msg.author.username}, ваш паспорт уже активирован.`);
                    msg.channel.send(emb);
                }
            });
        }
    }

    if (msg.channel.name === '🚗автошкола🚗'){
        if (msg.author.tag != 'RolePlayBot#2587'){
            msg.delete()
        }
        else{
            msg.delete({timeout: 5000})
        }
        if (msg.content.toUpperCase() === 'получить права'.toUpperCase()){
            con.query(`SELECT * FROM documents WHERE id = '${msg.author.id}'`, (err, rows) => {
                if (err) throw err;
                if (rows[0].driving == 'Yes'){
                    let emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setDescription(`${msg.author.username}, у вас уже есть водительское удостоверение`);
                    msg.channel.send(emb);
                } else if (rows[0].driving == 'No'){
                    con.query(`SELECT * FROM moneys WHERE id = '${msg.author.id}'`, async (err, rows1) => {
                        if (rows1[0].money >= 5000){
                            let sql = `UPDATE moneys SET money = '${Number(rows1[0].money) - 5000}' WHERE id = '${msg.author.id}'`;
                            con.query(sql);
                            emb = new Discord.MessageEmbed()
                                .setColor('#66bb6a')
                                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                .setDescription(`${msg.author.username}, обучение началось. Проверьте свои личные сообщения в дискорде.`);
                            msg.channel.send(emb);
                            emb = new Discord.MessageEmbed()
                                .setColor('#ef5350')
                                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                .setTitle(`Автошкола`)
                                .setDescription(`**Для прочтения данного блока, у вас есть минута!**
                                                 В экзамене вам предстоит ответить на 15 вопросов.
                                                 У вас 3 права на ошибку. Если ошибок будет больше
                                                 Вас не допустят до следующего экзамена. \n
                                                 Для ответа на вопрос нажимайте на реакцию нужного
                                                 номера. Если вы не ответите на вопрос в течение 25
                                                 секунд, экзамен будет закончен.
                                                 *Важно дождаться появления всех реакций.*\n
                                                 Чтобы начать экзамен нажмите на ✅`);
                            let message = await msg.author.send(emb);
                            await message.react("✅", {time:0});
                            drivingschool.push({id: `${msg.author.id}`, answer: 0, question: 0});

                            let filter = ((react, user) => (react.emoji.name == '✅' && user.id == msg.author.id))
                            const dsCollector = await message.createReactionCollector(filter, {time: 60000});
                            
                            dsCollector.on('collect', async (react, user) => {
                                switch(react.emoji.name){
                                    case ('✅'):
                                        QuestionsDriving(msg, message, 1, true)
                                    break
                                };
                            });

                            dsCollector.on('end', async collected => {
                                if (collected.size == 0){
                                    await message.delete();
                                    let emb = new Discord.MessageEmbed()
                                        .setColor('#ef5350')
                                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                        .setTitle('Автошкола')
                                        .setDescription('Вы не успели начать экзамен. Деньги были возвращены на ваш счёт.');
                                    message = await msg.author.send(emb)
                                    sql = `UPDATE moneys SET money = '${Number(rows1[0].money)}' WHERE id = '${msg.author.id}'`;
                                    con.query(sql);
                                    await message.delete({timeout: 15000})
                                };
                            });


                        } else {
                            emb = new Discord.MessageEmbed()
                                .setColor('#ec2925')
                                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                .setTitle('Операция не выполнена, недостаточно средств!');
                            msg.channel.send(emb);
                        };
                    });
                }
            });
        };
    };

    if (msg.channel.name === '💵банк💵'){
        if (msg.author.tag != 'RolePlayBot#2587'){
            msg.delete({timeout: 100});
        }
        else{
            msg.delete({timeout: 5000});
        }

        if (msg.content.toUpperCase() === 'баланс'.toUpperCase() || msg.content.toUpperCase() === 'бал'.toUpperCase()){
            con.query(`SELECT * FROM moneys WHERE id = '${msg.author.id}'`, async (err, rows) => {
                let canvas = Canvas.createCanvas(1920, 1080);
                let ctx = canvas.getContext('2d');
                let bgPhoto = await Canvas.loadImage('./ATM.png');
                ctx.drawImage(bgPhoto, 0, 0, canvas.width, canvas.height);
                ctx.font = '40px Comic Sans MS';
                ctx.fillStyle = 'black';
                ctx.fillText(msg.author.tag, 625, 450);
                ctx.font = '36px Comic Sans MS';
                ctx.fillText(`$${moneySort(rows[0].money)}`, 880, 580)
                if (rows[0].bank == -1){
                    ctx.fillText(`Нет`, 748, 697);
                }
                else{
                    ctx.fillText(`$${moneySort(rows[0].bank)}`, 748, 697);
                }

                let attachemnt = new Discord.MessageAttachment(canvas.toBuffer(), 'ATMImage.png');
                msg.channel.send(attachemnt)
            });
        }
    };

    if (msg.channel.name === '🎰игровой-автомат-1🎰' || msg.channel.name === '🎰игровой-автомат-2🎰' || msg.channel.name === '🎰игровой-автомат-3🎰'){
        if (msg.author.tag != 'RolePlayBot#2587'){
            msg.delete({timeout: 100});
        }
        else{
            msg.delete({timeout: 5000});
        }
        if (msg.content.toUpperCase().includes('слот'.toUpperCase()) == true){
            let combo = [
                'https://media.discordapp.net/attachments/807692510717673512/811646957298778143/out1.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647193051037737/out9.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647212353355826/out10.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647219244728380/out2.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647218816909352/out3.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647220335771744/out4.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647220607746102/out5.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647221861842954/out7.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647297183416370/out34.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647310818836560/out38.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647317710471198/out13.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647321434488842/out14.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647323029241866/out17.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647326488625162/out20.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647327122358372/out19.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647327404032030/out27.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647328675037275/out30.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647325189308416/out18.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647374472642590/out69.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647385842876466/out97.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647388648341605/out41.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647392104316989/out50.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647394101198848/out63.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647394122563614/out58.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647395057238046/out65.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811647394374221904/out61.png?width=917&height=608',
                'https://media.discordapp.net/attachments/807692510717673512/811651105238155294/out32.png?width=917&height=608'];
            let photoURL = Math.floor(Math.random() * combo.length);
            slotMoney = parseInt(msg.content.match(/\d+/));
            con.query(`SELECT * FROM moneys WHERE id = '${msg.author.id}'`, (err, rows) => {
                if (err) throw err;
                if (slotMoney >= 50){
                    if (rows[0].money >= slotMoney){
                        if (combo[photoURL] == 'https://media.discordapp.net/attachments/807692510717673512/811647310818836560/out38.png?width=917&height=608' || photoURL == 'https://media.discordapp.net/attachments/807692510717673512/811647388648341605/out41.png?width=917&height=608'){
                            moneyEdit('+', slotMoney * 2, msg, 'hand');
                            emb = new Discord.MessageEmbed()
                                .setColor('#66bb6a')
                                .setImage(`${combo[photoURL]}`)
                                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                .setTitle('Победа!');
                        }
                        else if(combo[photoURL] == 'https://media.discordapp.net/attachments/807692510717673512/811647212353355826/out10.png?width=917&height=608'){
                            moneyEdit('+', slotMoney * 3, msg, 'hand');
                            emb = new Discord.MessageEmbed()
                                .setColor('#66bb6a')
                                .setImage(`${combo[photoURL]}`)
                                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                .setTitle('Победа!');
                        }
                        else{
                            moneyEdit('-', slotMoney, msg, 'hand');
                            emb = new Discord.MessageEmbed()
                                .setColor('#ef5350')
                                .setImage(`${combo[photoURL]}`)
                                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                .setTitle('Проигрыш!');
                        };
                        msg.channel.send(emb);
                    }
                    else{
                        emb = new Discord.MessageEmbed()
                            .setColor('#ec2925')
                            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                            .setTitle('Операция не выполнена, недостаточно средств!');
                        msg.channel.send(emb);
                    };
                }
                else if(slotMoney < 50){
                    emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setTitle('Операция не выполнена, сумма слишком мала!');
                    msg.channel.send(emb);
                }
                else{
                    emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setTitle('Операция не выполнена, сумма не указана!');
                    msg.channel.send(emb);
                }
            });
        };
    };

    if (blackjackChannels.indexOf(msg.channel.name) !== -1){
        if (msg.author.tag === 'RolePlayBot#2587'){
            let embed = msg.embeds[0];
            if (!embed) return;
            if (embed.title){
                msg.delete({timeout: 5000});
            };
        };

        if (msg.content.toUpperCase().includes('Начать'.toUpperCase()) == true){
            msg.delete();
            con.query(`SELECT * FROM blackjack WHERE id = '${msg.author.id}'`, async (err, rows) => {
                if (rows.length == 0) {
                    let blackjackMoney = parseInt(msg.content.match(/\d+/))
                    if (blackjackMoney >= 150){
                        con.query(`SELECT * FROM moneys WHERE id = '${msg.author.id}'`, async (err, rows) => {
                            if (blackjackMoney <= rows[0].money){
                                moneyEdit('-', blackjackMoney, msg, 'hand')
                                let cards_hand = [];
                                let cards_dealer = [];

                                while (true){ // Карты для игрока
                                    let card_number = Math.floor(Math.random() * (51 - 0 + 1)) + 0;
                                    if (cards_hand.indexOf(cards[card_number]) === -1){
                                        cards_hand.push(cards[card_number]);
                                        if (cards_hand.length == 2){
                                            break;
                                        };
                                    };
                                };

                                while(true){ // Карты для дилера
                                    let card_number = Math.floor(Math.random() * (51 - 0 + 1)) + 0;
                                    if (cards_dealer.indexOf(cards[card_number]) === -1 && cards_hand.indexOf(cards[card_number]) === -1){
                                        cards_dealer.push(cards[card_number]);
                                        if (cards_dealer.length == 2){
                                            break;
                                        };
                                    };
                                };

                                let count_hand = cards_count(cards_hand)
                                let count_dealer = cards_count(cards_dealer)

                                if (count_hand === 21 && count_dealer === 21){
                                    emb = new Discord.MessageEmbed()
                                        .setColor('#ff9d00')
                                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                        .setDescription(`**Ничья!** \n \n Каждый остался при своём.`)
                                        .addFields(
                                            {name: 'У вас:', value: (`<:${cards_hand[0].name}:${cards_hand[0].id}> <:${cards_hand[1].name}:${cards_hand[1].id}> \n
                                            Счёт: ${count_hand}`), inline: true},
                                            {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:${cards_dealer[1].name}:${cards_dealer[1].id}> \n
                                            Счёт: ${count_dealer}`), inline: true},
                                        );
                                    msg.channel.send(emb);
                                } else if (count_hand === 21){
                                    emb = new Discord.MessageEmbed()
                                    .setColor('#66bb6a')
                                    .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                    .setDescription(`**Победа!** \n \n Дилер потерял: $${moneySort(blackjackMoney)}`)
                                    .addFields(
                                        {name: 'У вас:', value: (`<:${cards_hand[0].name}:${cards_hand[0].id}> <:${cards_hand[1].name}:${cards_hand[1].id}> \n
                                        Счёт: ${count_hand}`), inline: true},
                                        {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:${cards_dealer[1].name}:${cards_dealer[1].id}> \n
                                        Счёт: ${count_dealer}`), inline: true},
                                    );
                                    msg.channel.send(emb);
                                } else if (count_dealer === 21){
                                    emb = new Discord.MessageEmbed()
                                    .setColor('#ef5350')
                                    .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                    .setDescription(`**Проигрыш!** \n \n Вы потеряли: $${moneySort(blackjackMoney)}`)
                                    .addFields(
                                        {name: 'У вас:', value: (`<:${cards_hand[0].name}:${cards_hand[0].id}> <:${cards_hand[1].name}:${cards_hand[1].id}> \n
                                        Счёт: ${count_hand}`), inline: true},
                                        {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:${cards_dealer[1].name}:${cards_dealer[1].id}> \n
                                        Счёт: ${count_dealer}`), inline: true},
                                    );
                                    msg.channel.send(emb);
                                } else {
                                    emb = new Discord.MessageEmbed()
                                    .setColor('#81bdff')
                                    .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                    .setDescription(`Напишите: **ещё** - взять ещё одну карту; **удвоить** - удвоить ставку; **стоп** - закончить игру. \n \n Ставка: $${moneySort(blackjackMoney)}`)
                                    .addFields(
                                        {name: 'У вас:', value: (`<:${cards_hand[0].name}:${cards_hand[0].id}> <:${cards_hand[1].name}:${cards_hand[1].id}> \n
                                        Счёт: ${count_hand}`), inline: true},
                                        {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:empty:809496866521088070> \n
                                        Счёт: ${count_dealer - cards_count([cards_dealer[1]])}`), inline: true},
                                    );
                                    let message = await msg.channel.send(emb);
                                    
                                    let handStr = '';
                                    for (i=0; i < cards_hand.length; i++){
                                        handStr += `${cards_hand[i].name},`
                                    };

                                    let dealerStr = '';
                                    for (i=0; i < cards_hand.length; i++){
                                        dealerStr += `${cards_dealer[i].name},`
                                    };
                                    
                                    sql = `INSERT INTO blackjack (id, money, on_hand, dealer, count_hand, count_dealer, message_id) VALUES ('${msg.author.id}', '${blackjackMoney}', '${handStr}', '${dealerStr}', '${count_hand}', '${count_dealer}', '${message.id}')`;
                                    con.query(sql);

                                    sql = `DELETE FROM blackjack WHERE id = '${msg.author.id}'`;
                                    setTimeout(() => console.log(message), 120000);
                                    message.delete({timeout: 120000});
                                    setTimeout(() => con.query(sql), 120000);
                                };
                            } else{
                                emb = new Discord.MessageEmbed()
                                    .setColor('#ec2925')
                                    .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                    .setTitle('Операция не выполнена, недостаточно средств!');
                                msg.channel.send(emb);
                            };
                        });
                    } else if (blackjackMoney < 150) {
                        emb = new Discord.MessageEmbed()
                            .setColor('#ec2925')
                            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                            .setTitle('Операция не выполнена, сумма слишком мала!');
                        msg.channel.send(emb);
                    } else{
                        emb = new Discord.MessageEmbed()
                            .setColor('#ec2925')
                            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                            .setTitle('Операция не выполнена, сумма не указана!');
                        msg.channel.send(emb);
                    }
                } else{
                    emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setTitle('Внимание, игра уже идёт!');
                    msg.channel.send(emb)
                };
            });
        }

        else if (msg.content.toUpperCase().includes('ещё'.toUpperCase()) == true){
            msg.delete();
            con.query(`SELECT * FROM blackjack WHERE id = '${msg.author.id}'`, async (err, rows) => {
                if (err) throw err;
                if (rows.length != 0) {
                    let cards_hand = [];
                    let cards_dealer = [];

                    let cards_handStr = rows[0].on_hand;
                    let cards_dealerStr = rows[0].dealer;
                    let blackjackMoney = rows[0].money;

                    cards_handStr = cards_handStr.split(',');
                    cards_handStr.pop();
                    for (i=0; i < cards_handStr.length; i++){
                        let number = cards.findIndex(card => card.name == cards_handStr[i]);
                        cards_hand.push(cards[number]);
                    };

                    cards_dealerStr = cards_dealerStr.split(',');
                    cards_dealerStr.pop();

                    for (i=0; i < cards_dealerStr.length; i++){
                        let number = cards.findIndex(card => card.name == cards_dealerStr[i]);
                        cards_dealer.push(cards[number]);
                    };

                    let messageId = rows[0].message_id;
                    let count_hand = rows[0].count_hand;
                    let count_dealer = cards_count([cards_dealer[0]]);

                    while (true){
                        let card_number = Math.floor(Math.random() * (51 - 0 + 1)) + 0;
                        if (cards_hand.indexOf(cards[card_number]) === -1 && cards_dealer.indexOf(cards[card_number]) === -1){
                            cards_hand.push(cards[card_number]);
                            break
                        };
                    };

                    count_hand += cards_count([cards_hand[cards_hand.length - 1]])

                    let cardsEmojis = ''
                    for (i=0; i < cards_hand.length; i++){
                        cardsEmojis += `<:${cards_hand[i].name}:${cards_hand[i].id}>`
                    };

                    if (count_hand == 21){
                        emb = new Discord.MessageEmbed()
                            .setColor('#66bb6a')
                            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                            .setDescription(`**Победа!** \n \n Дилер потерял $${blackjackMoney}.`)
                            .addFields(
                                {name: 'У вас:', value: (`${cardsEmojis} \n
                                Счёт: ${count_hand}`), inline: true},
                                {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:empty:809496866521088070> \n
                                Счёт: ${count_dealer}`), inline: true}
                            );
                        let message = await msg.channel.messages.cache.get(`${messageId}`);
                        await message.edit(emb);
                        message.delete({timeout: 10000});
                        let sql = `DELETE FROM blackjack WHERE id = '${msg.author.id}'`;
                        con.query(sql);

                        moneyEdit('+', blackjackMoney*2, msg, 'hand')

                    } else if (count_hand < 21){
                        emb = new Discord.MessageEmbed()
                            .setColor('#81bdff')
                            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                            .setDescription(`Напишите: **ещё** - взять ещё одну карту; **удвоить** - удвоить ставку; **стоп** - закончить игру. \n \n Ставка: $${moneySort(blackjackMoney)}`)
                            .addFields(
                                {name: 'У вас:', value: (`${cardsEmojis} \n
                                Счёт: ${count_hand}`), inline: true},
                                {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:empty:809496866521088070> \n
                                Счёт: ${count_dealer}`), inline: true}
                            );
                        let message = await msg.channel.messages.cache.get(`${messageId}`);
                        await message.edit(emb);

                        handStr = '';
                        for (i=0; i < cards_hand.length; i++){
                            handStr += `${cards_hand[i].name},`
                        };
    
                        dealerStr = '';
                        for (i=0; i < cards_dealer.length; i++){
                            dealerStr += `${cards_dealer[i].name},`
                        };

                        let sql = `UPDATE blackjack SET on_hand = '${handStr}' WHERE id = '${msg.author.id}'`;
                        con.query(sql);
    
                        
                        sql = `UPDATE blackjack SET count_hand = '${count_hand}' WHERE id = '${msg.author.id}'`;
                        con.query(sql);
    
                        sql = `UPDATE blackjack SET dealer = '${dealerStr}' WHERE id = '${msg.author.id}'`;
                        con.query(sql);  

                    } else {
                        emb = new Discord.MessageEmbed()
                            .setColor('#ef5350')
                            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                            .setDescription(`**Проигрыш!** \n \n Вы потеряли $${blackjackMoney}.`)
                            .addFields(
                                {name: 'У вас:', value: (`${cardsEmojis} \n
                                Счёт: ${count_hand}`), inline: true},
                                {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:empty:809496866521088070> \n
                                Счёт: ${count_dealer}`), inline: true}
                            );
                        let message = await msg.channel.messages.cache.get(`${messageId}`);
                        await message.edit(emb);
                        let sql = `DELETE FROM blackjack WHERE id = '${msg.author.id}'`;
                        con.query(sql);
                        await message.delete({timeout: 10000});                                     
                    };
                } else {
                    let emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setTitle('Внимание, вы ещё не начали игру!');
                    msg.channel.send(emb);
                };
            });
        }

        else if (msg.content.toUpperCase().includes('удвоить'.toUpperCase()) == true){
            msg.delete();
            con.query(`SELECT * FROM blackjack WHERE id = '${msg.author.id}'`, async (err, rows) => {
                if (rows.length != 0) {
                        con.query(`SELECT * FROM moneys WHERE id = '${msg.author.id}'`, async (err, rows1) => {
                            let money = rows1[0].money
                            let blackjackMoney = rows[0].money
                            if(blackjackMoney * 2 <= money){
                                let messageId = rows[0].message_id
                                let cards_hand = [];
                                let cards_dealer = [];

                                let cards_handStr = rows[0].on_hand;
                                let cards_dealerStr = rows[0].dealer;
                                let blackjackMoney = rows[0].money;

                                cards_handStr = cards_handStr.split(',');
                                cards_handStr.pop();
                                for (i=0; i < cards_handStr.length; i++){
                                    let number = cards.findIndex(card => card.name == cards_handStr[i]);
                                    cards_hand.push(cards[number]);
                                };

                                cards_dealerStr = cards_dealerStr.split(',');
                                cards_dealerStr.pop();

                                for (i=0; i < cards_dealerStr.length; i++){
                                    let number = cards.findIndex(card => card.name == cards_dealerStr[i]);
                                    cards_dealer.push(cards[number]);
                                };

                                let count_hand = rows[0].count_hand;
                                let count_dealer = cards_count([cards_dealer[0]]);

                                while (true){
                                    let card_number = Math.floor(Math.random() * (51 - 0 + 1)) + 0;
                                    if (cards_hand.indexOf(cards[card_number]) === -1 && cards_dealer.indexOf(cards[card_number]) === -1){
                                        cards_hand.push(cards[card_number]);
                                        break
                                    };
                                };

                                count_hand += cards_count([cards_hand[cards_hand.length - 1]])

                                let cardsEmojis = ''
                                for (i=0; i < cards_hand.length; i++){
                                    cardsEmojis += `<:${cards_hand[i].name}:${cards_hand[i].id}>`
                                };

                                if (count_hand == 21){
                                    emb = new Discord.MessageEmbed()
                                        .setColor('#66bb6a')
                                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                        .setDescription(`**Победа!** \n \n Дилер потерял $${blackjackMoney * 2}.`)
                                        .addFields(
                                            {name: 'У вас:', value: (`${cardsEmojis} \n
                                            Счёт: ${count_hand}`), inline: true},
                                            {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:empty:809496866521088070> \n
                                            Счёт: ${count_dealer}`), inline: true}
                                        );
                                    let message = await msg.channel.messages.cache.get(`${messageId}`);
                                    await message.edit(emb);
                                    message.delete({timeout: 10000});
                                    let sql = `DELETE FROM blackjack WHERE id = '${msg.author.id}'`;
                                    con.query(sql);

                                    moneyEdit('+', blackjackMoney * 4, msg, 'hand')

                                } else if (count_hand < 21){
                                    emb = new Discord.MessageEmbed()
                                        .setColor('#81bdff')
                                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                        .setDescription(`Напишите: **ещё** - взять ещё одну карту; **удвоить** - удвоить ставку; **стоп** - закончить игру. \n \n Ставка: $${moneySort(blackjackMoney * 2)}`)
                                        .addFields(
                                            {name: 'У вас:', value: (`${cardsEmojis} \n
                                            Счёт: ${count_hand}`), inline: true},
                                            {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:empty:809496866521088070> \n
                                            Счёт: ${count_dealer}`), inline: true}
                                        );
                                    let message = await msg.channel.messages.cache.get(`${messageId}`);
                                    await message.edit(emb);

                                    handStr = '';
                                    for (i=0; i < cards_hand.length; i++){
                                        handStr += `${cards_hand[i].name},`
                                    };
                
                                    dealerStr = '';
                                    for (i=0; i < cards_dealer.length; i++){
                                        dealerStr += `${cards_dealer[i].name},`
                                    };

                                    let sql = `UPDATE blackjack SET on_hand = '${handStr}' WHERE id = '${msg.author.id}'`;
                                    con.query(sql);
                
                                    sql = `UPDATE blackjack SET count_hand = '${count_hand}' WHERE id = '${msg.author.id}'`;
                                    con.query(sql);
                
                                    sql = `UPDATE blackjack SET dealer = '${dealerStr}' WHERE id = '${msg.author.id}'`;
                                    con.query(sql);  

                                    sql = `UPDATE blackjack SET money = '${blackjackMoney * 2}'`;
                                    con.query(sql);

                                } else {
                                    emb = new Discord.MessageEmbed()
                                        .setColor('#ef5350')
                                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                        .setDescription(`**Проигрыш!** \n \n Вы потеряли $${blackjackMoney * 2}.`)
                                        .addFields(
                                            {name: 'У вас:', value: (`${cardsEmojis} \n
                                            Счёт: ${count_hand}`), inline: true},
                                            {name: 'У дилера:', value: (`<:${cards_dealer[0].name}:${cards_dealer[0].id}> <:empty:809496866521088070> \n
                                            Счёт: ${count_dealer}`), inline: true}
                                        );
                                    let message = await msg.channel.messages.cache.get(`${messageId}`);
                                    await message.edit(emb);
                                    let sql = `DELETE FROM blackjack WHERE id = '${msg.author.id}'`;
                                    con.query(sql);
                                    moneyEdit('-', blackjackMoney, msg, 'hand')
                                    await message.delete({timeout: 10000});                                  
                                };
                            } else {
                                let emb = new Discord.MessageEmbed()
                                    .setColor('#ec2925')
                                    .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                                    .setTitle('Операция не выполнена, недостаточно средств!');
                                msg.channel.send(emb);
                            };
                        });
                } else {
                    let emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setTitle('Внимание, вы ещё не начали игру!');
                    msg.channel.send(emb);
                }
            });
        }

        else if (msg.content.toUpperCase().includes('стоп'.toUpperCase()) == true){
            msg.delete();
            con.query(`SELECT * FROM blackjack WHERE id = '${msg.author.id}'`, async (err, rows) => {
                if (rows.length != 0) {
                    let messageId = rows[0].message_id
                    let cards_hand = [];
                    let cards_dealer = [];

                    let cards_handStr = rows[0].on_hand;
                    let cards_dealerStr = rows[0].dealer;
                    let blackjackMoney = rows[0].money;

                    cards_handStr = cards_handStr.split(',');
                    cards_handStr.pop();
                    for (i=0; i < cards_handStr.length; i++){
                        let number = cards.findIndex(card => card.name == cards_handStr[i]);
                        cards_hand.push(cards[number]);
                    };

                    cards_dealerStr = cards_dealerStr.split(',');
                    cards_dealerStr.pop();
                    for (i=0; i < cards_dealerStr.length; i++){
                        let number = cards.findIndex(card => card.name == cards_dealerStr[i]);
                        cards_dealer.push(cards[number]);
                    };

                    let count_hand = rows[0].count_hand;

                    while (true){
                        let count_dealer = cards_count(cards_dealer);
                        if (count_dealer > count_hand){
                            break
                        } if (count_dealer <= 17){
                            let card_number = Math.floor(Math.random() * (51 - 0 + 1)) + 0;
                            if (cards_hand.indexOf(cards[card_number]) === -1 && cards_dealer.indexOf(cards[card_number]) === -1){
                                cards_dealer.push(cards[card_number]);
                            };
                        } else if (count_dealer > 17 && count_dealer < 20 && count_dealer < count_hand){
                            let card_number = Math.floor(Math.random() * (51 - 0 + 1)) + 0;
                            if (cards_hand.indexOf(cards[card_number]) === -1 && cards_dealer.indexOf(cards[card_number]) === -1){
                                cards_dealer.push(cards[card_number]);
                            };
                        } else {
                            break
                        };
                    };

                    let count_dealer = cards_count(cards_dealer);

                    let cardsEmojis = '' // Игрок
                    for (i=0; i < cards_hand.length; i++){
                        cardsEmojis += `<:${cards_hand[i].name}:${cards_hand[i].id}>`
                    };

                    let cardsEmojis1 = '' // Дилер
                    for (i=0; i < cards_dealer.length; i++){
                        cardsEmojis1 += `<:${cards_dealer[i].name}:${cards_dealer[i].id}>`
                    };

                    if (count_hand > count_dealer || count_dealer > 21){
                        emb = new Discord.MessageEmbed()
                            .setColor('#66bb6a')
                            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                            .setDescription(`**Победа!** \n \n Дилер потерял $${blackjackMoney * 2}.`)
                            .addFields(
                                {name: 'У вас:', value: (`${cardsEmojis} \n
                                Счёт: ${count_hand}`), inline: true},
                                {name: 'У дилера:', value: (`${cardsEmojis1} \n
                                Счёт: ${count_dealer}`), inline: true}
                            );
                        let message = await msg.channel.messages.cache.get(`${messageId}`);
                        await message.edit(emb);
                        let sql = `DELETE FROM blackjack WHERE id = '${msg.author.id}'`;
                        con.query(sql);
                        moneyEdit('+', blackjackMoney * 2, msg, 'hand')
                        await message.delete({timeout: 10000});

                    } else if (count_hand < count_dealer && count_dealer <= 21){
                        emb = new Discord.MessageEmbed()
                            .setColor('#ef5350')
                            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                            .setDescription(`**Проигрыш!** \n Вы потеряли $${blackjackMoney}`)
                            .addFields(
                                {name: 'У вас:', value: (`${cardsEmojis} \n
                                Счёт: ${count_hand}`), inline: true},
                                {name: 'У дилера:', value: (`${cardsEmojis1} \n
                                Счёт: ${count_dealer}`), inline: true}
                            );
                        let message = await msg.channel.messages.cache.get(`${messageId}`);
                        await message.edit(emb);
                        let sql = `DELETE FROM blackjack WHERE id = '${msg.author.id}'`;
                        con.query(sql);
                        await message.delete({timeout: 10000});

                    } else {
                        emb = new Discord.MessageEmbed()
                            .setColor('#ef5350')
                            .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                            .setDescription(`**Ничья** \n \n Вы потеряли $${blackjackMoney * 2}.`)
                            .addFields(
                                {name: 'У вас:', value: (`${cardsEmojis} \n
                                Счёт: ${count_hand}`), inline: true},
                                {name: 'У дилера:', value: (`${cardsEmojis1} \n
                                Счёт: ${count_dealer}`), inline: true}
                            );
                        let message = await msg.channel.messages.cache.get(`${messageId}`);
                        await message.edit(emb);
                        let sql = `DELETE FROM blackjack WHERE id = '${msg.author.id}'`;
                        con.query(sql);
                        moneyEdit('+', blackjackMoney, msg, 'hand')
                        await message.delete({timeout: 10000});                                  
                    };



                } else {
                    let emb = new Discord.MessageEmbed()
                        .setColor('#ec2925')
                        .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                        .setTitle('Внимание, вы ещё не начали игру!');
                    msg.channel.send(emb);
                }
            });
        }

        else {
            if (msg.author.tag != 'RolePlayBot#2587'){
                msg.delete();
            };
        };
    };

    if (msg.channel.name === '🚘🙋проституция🙋🚘'){
        if (msg.content.toUpperCase() === 'шлюха'.toUpperCase()){
            msg.delete();
            let emb = new Discord.MessageEmbed()
                .setColor('#ff9d00')
                .setAuthor(`${msg.author.tag}`, `${msg.author.displayAvatarURL({format: 'png'})}`)
                .setTitle('Проституция')
                .setDescription('Нажимайте на реакции как можно быстрее.')
                .setImage('https://media.discordapp.net/attachments/807692510717673512/817271690257891358/Devushki-legkogo-povedenia-v-gta-5.png');
            let message = await msg.channel.send(emb);
            await message.react('🙋‍♀️');
            let filter = ((react, user) => (react.emoji.name == '🙋‍♀️' && user.id == msg.author.id));
            await collectorSlut(filter, message);
            //await message.delete({timeout: 25000});
        }
    }
});
bot.login(token);