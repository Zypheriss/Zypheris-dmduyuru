const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const { token, logFile, ownerID } = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const cooldowns = new Map();
let successLog = [];
let failLog = [];

const handleRateLimit = async (func, delay = 800) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return func();
};

client.once('ready', () => {
    console.log(`${client.user.tag} giriş yaptım hacı`);
});

client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (message.author.id !== ownerID && command.startsWith('!')) {
        return message.reply('Bu komutu kullanma yetkiniz yok!');
    }

    if (command === '!dm') {
        const mention = message.mentions.users.first();
        const limit = parseInt(args.find(arg => !isNaN(arg)), 10);
        const dmMessage = args.filter(arg => isNaN(arg) && !arg.startsWith('<@')).join(' ');

        if (!dmMessage) {
            return message.reply('Göndermek istediğiniz mesajı yazmalısınız!');
        }

        const members = await message.guild.members.fetch();
        successLog = [];
        failLog = [];
        let count = 0;

        for (const [, member] of members) {
            if (!member.user.bot) {
                if (mention && member.user.id !== mention.id) continue;
                if (limit && count >= limit) break;

                await handleRateLimit(() =>
                    member.send(dmMessage)
                        .then(() => {
                            successLog.push(member.user.tag);
                            count++;
                        })
                        .catch(() => {
                            failLog.push(member.user.tag);
                        })
                );
            }
        }

        const logMessage = `\n=== ${new Date().toLocaleString()} ===\nBaşarılı:\n${successLog.join('\n')}\nBaşarısız:\n${failLog.join('\n')}\n`;
        fs.appendFile(logFile, logMessage, err => {
            if (err) console.error('Log dosyasına yazılamadı:', err);
        });

        message.channel.send(`Mesaj gönderimi tamamlandı!\nBaşarılı: ${successLog.length}\nBaşarısız: ${failLog.length}`);
    }

    if (command === '!herkeseks') {
        const dmMessage = args.join(' ');

        if (!dmMessage) {
            return message.reply('Herkese göndermek istediğiniz mesajı yazmalısınız!');
        }

        const members = await message.guild.members.fetch();
        successLog = [];
        failLog = [];

        for (const [, member] of members) {
            if (!member.user.bot) {
                await handleRateLimit(() =>
                    member.send(dmMessage)
                        .then(() => {
                            successLog.push(member.user.tag);
                        })
                        .catch(() => {
                            failLog.push(member.user.tag);
                        })
                );
            }
        }

        const logMessage = `\n=== ${new Date().toLocaleString()} ===\nBaşarılı:\n${successLog.join('\n')}\nBaşarısız:\n${failLog.join('\n')}\n`;
        fs.appendFile(logFile, logMessage, err => {
            if (err) console.error('Log dosyasına yazılamadı:', err);
        });

        message.channel.send(`Mesaj gönderimi tamamlandı!\nBaşarılı: ${successLog.length}\nBaşarısız: ${failLog.length}`);
    }

    if (command === '!istatistik') {
        const istatistikMesajı = `**Mesaj İstatistikleri:**\n\n Başarılı Gönderimler: ${successLog.length}\n Başarısız Gönderimler: ${failLog.length}\n\n**Başarısız Kullanıcılar:**\n${failLog.length > 0 ? failLog.join('\n') : 'Yok'}`;
        message.channel.send(istatistikMesajı);
    }

    if (command === '!setavatar') {
        const imageURL = args[0];

        if (!imageURL) {
            return message.reply('Profil resmi URL’sini belirtmelisiniz!');
        }

        try {
            await client.user.setAvatar(imageURL);
            message.channel.send('Profil resmi başarıyla değiştirildi!');
        } catch (err) {
            message.channel.send('Profil resmi değiştirilirken bir hata oluştu: ' + err.message);
        }
    }

    if (command === '!setusername') {
        const newUsername = args.join(' ');

        if (!newUsername) {
            return message.reply('Yeni kullanıcı adını belirtmelisiniz!');
        }

        try {
            await client.user.setUsername(newUsername);
            message.channel.send(`Kullanıcı adı başarıyla "${newUsername}" olarak değiştirildi!`);
        } catch (err) {
            message.channel.send('Kullanıcı adı değiştirilirken bir hata oluştu: ' + err.message);
        }
    }

    if (command === '!setstatus') {
        const statusType = args[0]?.toLowerCase();
        const statusMessage = args.slice(1).join(' ');

        if (!statusType || !statusMessage) {
            return message.reply('durum türü ile mesajını belirtsene oğlum');
        }

        let activity;
        switch (statusType) {
            case 'dnd':
                activity = { name: statusMessage, type: 3 };
                break;
            case 'idle':
                activity = { name: statusMessage, type: 1 };
                break;
            case 'playing':
                activity = { name: statusMessage, type: 0 };
                break;
            case 'streaming':
                activity = { name: statusMessage, type: 1, url: 'https://twitch.tv/ilwixi' };
                break;
            case 'listening':
                activity = { name: statusMessage, type: 2 };
                break;
            case 'watching':
                activity = { name: statusMessage, type: 3 };
                break;
            default:
                return message.reply('Geçersiz durum türü');
        }

        await client.user.setActivity(activity);
        message.channel.send(`Durum başarıyla "${statusType}" olarak değiştirildi: ${statusMessage}`);
    }

    if (command === '!yardım') {
        const helpEmbed = {
            color: 0x0099ff,
            title: 'Bot Komutları',
            description: 'Bu botun kullanabileceğiniz komutlar:',
            fields: [
                { name: '!dm', value: 'Belirli bir kullanıcıya DM gönder.' },
                { name: '!herkeseks', value: 'Herkese DM gönder.' },
                { name: '!istatistik', value: 'Gönderim istatistiklerini gör.' },
                { name: '!setavatar', value: 'Botun avatarını değiştir.' },
                { name: '!setusername', value: 'Botun kullanıcı adını değiştir.' },
                { name: '!setstatus', value: 'Botun durumunu değiştir.' },
            ],
            footer: { text: 'Daha fazla yardım için zypheris e  yaz.' },
        };

        message.channel.send({ embeds: [helpEmbed] });
    }
});

client.login(token);
