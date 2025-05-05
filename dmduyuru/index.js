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

client.once('ready', () => {
    console.log(`${client.user.tag} başarıyla giriş yaptı!`);
});

client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

  
    if (message.content.startsWith('!') && message.author.id !== ownerID) {
        return message.reply('Bu komutu kullanma yetkiniz yok!');
    }

  
    if (message.content.startsWith('!dm')) {
        const args = message.content.split(' ').slice(1);
        const mention = message.mentions.users.first();
        const limit = parseInt(args.find(arg => !isNaN(arg)), 10);
        const dmMessage = args.filter(arg => isNaN(arg) && !arg.startsWith('<@')).join(' ');

        if (!dmMessage) {
            return message.reply('Göndermek istediğiniz mesajı yazmalısınız! Örnek: `!dm @Kullanıcı zypherisin selamı var!`');
        }

        const members = await message.guild.members.fetch();
        successLog = [];
        failLog = [];

        let count = 0;
        const promises = [];

        for (const [id, member] of members) {
            if (!member.user.bot) {
                if (mention && member.user.id !== mention.id) continue;
                if (limit && count >= limit) break;

                promises.push(
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

       
        await Promise.all(promises);

        const logMessage = `\n=== ${new Date().toLocaleString()} ===\nBaşarılı:\n${successLog.join('\n')}\nBaşarısız:\n${failLog.join('\n')}\n`;

        fs.appendFile(logFile, logMessage, (err) => {
            if (err) console.error('Log dosyasına yazılamadı:', err);
        });

        message.channel.send(`Mesaj gönderimi tamamlandı!\nBaşarılı: ${successLog.length}\nBaşarısız: ${failLog.length}`);
    }

    
    if (message.content.startsWith('!herkeseks')) {
        const args = message.content.split(' ').slice(1);
        const dmMessage = args.join(' ');

        if (!dmMessage) {
            return message.reply('Herkese göndermek istediğiniz mesajı yazmalısınız! Örnek: `!herkeseks Zypheris`');
        }

        const members = await message.guild.members.fetch();
        successLog = [];
        failLog = [];

        const promises = [];

        for (const [id, member] of members) {
            if (!member.user.bot) {
                promises.push(
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

        
        await Promise.all(promises);

        const logMessage = `\n=== ${new Date().toLocaleString()} ===\nBaşarılı:\n${successLog.join('\n')}\nBaşarısız:\n${failLog.join('\n')}\n`;

        fs.appendFile(logFile, logMessage, (err) => {
            if (err) console.error('Log dosyasına yazılamadı:', err);
        });

        message.channel.send(`Mesaj gönderimi tamamlandı!\nBaşarılı: ${successLog.length}\nBaşarısız: ${failLog.length}`);
    }

  
    if (message.content.startsWith('!istatistik')) {
        const istatistikMesajı = `**Mesaj İstatistikleri:**\n\n` +
            `🔹 Başarılı Gönderimler: ${successLog.length}\n` +
            `🔸 Başarısız Gönderimler: ${failLog.length}\n\n` +
            `**Başarısız Kullanıcılar:**\n${failLog.length > 0 ? failLog.join('\n') : 'Yok'}`;

        message.channel.send(istatistikMesajı);
    }

    
    if (message.content.startsWith('!setavatar')) {
        const args = message.content.split(' ').slice(1);
        const imageURL = args[0];

        if (!imageURL) {
            return message.reply('Profil resmi URL’sini belirtmelisiniz! Örnek: `!setavatar <URL>`');
        }

        try {
            await client.user.setAvatar(imageURL);
            message.channel.send('Profil resmi başarıyla değiştirildi!');
        } catch (err) {
            message.channel.send('Profil resmi değiştirilirken bir hata oluştu: ' + err.message);
        }
    }

    
    if (message.content.startsWith('!setusername')) {
        const args = message.content.split(' ').slice(1);
        const newUsername = args.join(' ');

        if (!newUsername) {
            return message.reply('Yeni kullanıcı adını belirtmelisiniz! Örnek: `!setusername YeniKullanıcıAdı`');
        }

        try {
            await client.user.setUsername(newUsername);
            message.channel.send(`Kullanıcı adı başarıyla "${newUsername}" olarak değiştirildi!`);
        } catch (err) {
            message.channel.send('Kullanıcı adı değiştirilirken bir hata oluştu: ' + err.message);
        }
    }

 
    if (message.content.startsWith('!setstatus')) {
        const args = message.content.split(' ').slice(1);
        const statusType = args[0].toLowerCase();
        const statusMessage = args.slice(1).join(' ');

        if (!statusType || !statusMessage) {
            return message.reply('Durum türü ve mesajını belirtmelisiniz! Örnek: `!setstatus dnd Zypheris`');
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
                return message.reply('Geçersiz durum türü! Geçerli türler: `dnd`, `idle`, `playing`, `streaming`, `listening`, `watching`');
        }

        await client.user.setActivity(activity);
        message.channel.send(`Durum başarıyla "${statusType}" olarak değiştirildi: ${statusMessage}`);
    }

    
    if (message.content.startsWith('!yardım')) {
        const helpEmbed = {
            color: 0x0099ff,
            title: 'Bot Komutları',
            description: 'Bu botun kullanabileceğiniz komutlar:',
            fields: [
                {
                    name: '!dm',
                    value: 'Belirli bir kullanıcıya DM göndermenizi sağlar. Örnek: `!dm @Kullanıcı Merhaba!`',
                },
                {
                    name: '!herkeseks',
                    value: 'Herkese DM göndermenizi sağlar. Örnek: `!herkeseks Merhaba arkadaşlar!`',
                },
                {
                    name: '!istatistik',
                    value: 'Mesaj gönderim istatistiklerinizi gösterir.',
                },
                {
                    name: '!setavatar',
                    value: 'Botun profil resmini değiştirir. Örnek: `!setavatar <URL>`',
                },
                {
                    name: '!setusername',
                    value: 'Botun kullanıcı adını değiştirir. Örnek: `!setusername YeniKullanıcıAdı`',
                },
                {
                    name: '!setstatus',
                    value: 'Botun durumunu değiştirir. Örnek: `!setstatus dnd Zypheris`',
                },
            ],
            footer: {
                text: 'Yararlı komutlar ve bot kontrolü için!',
            },
        };

        message.channel.send({ embeds: [helpEmbed] });
    }

   // hacım bu naruto komutu seçtiğin kişiye dm ine spam yapıyor şu şekil !naruto @zypheris naber - bu naber mesajını 50 kere tekrarlıcak 1 kere gönderdi tekrar göndericek
// o şekilde 50 kere tekrarlıyor bunu nasıl kısarım veya artırırım derseniz şuan da 258 satırdaki if ( count < 50 ) yazan yerin içindeki 50 tekrarlama döngüsünün sayısı işte onu 100 yaparsanız 100 kere atar 10 yaparsan 10 kere atar
    if (message.content.startsWith('!naruto')) {
        const args = message.content.split(' ').slice(1);
        const mention = message.mentions.users.first();
        const narutoMessage = args.slice(1).join(' ');

        
        if (!mention || !narutoMessage) {
            return message.reply('Etiketlediğiniz kullanıcıyı ve mesajı belirtmelisiniz! Örnek: `!naruto @Kullanıcı Mesajınız`');
        }

        
        try {
            let count = 0;
            const repeatMessage = async () => {
                if (count < 50) {
                    try {
                        await mention.send(narutoMessage);  
                        count++;
                        setTimeout(repeatMessage, 1000);
                    } catch (error) {
                        console.error('Mesaj gönderilirken bir hata oluştu:', error);
                    }
                }
            };

            repeatMessage(); 
            message.channel.send(`${mention.tag} adlı kullanıcıya mesaj başarıyla gönderilmeye başlandı!`);
        } catch (err) {
            console.error('Mesaj gönderme hatası:', err);
            message.channel.send('Mesaj gönderilirken bir hata oluştu!');
        }
    }
});

client.login(token);
