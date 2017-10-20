const { Client, RichEmbed } = require('discord.js');
const { get } = require('snekfetch');
const client = new Client();
const prefix = 'r!';
let logChannel;
require('dotenv').load();

client.on('ready', () => { 
	console.log('redcord is reddy. id: ' + client.user.id);
	logChannel = client.channels.get('370739259398815744');
})

client.on('guildCreate', (guild) => {
	logChannel.send(`Joined guild ${guild.name}, with ${guild.memberCount} members.`)
})

client.on('guildDelete', (guild) => {
	logChannel.send(`Left guild ${guild.name}, with ${guild.memberCount} members.`)
})

//https://discordapp.com/oauth2/authorize?client_id=370738834939576321&scope=bot&permissions=1074007104

client.on('message', async (msg) => {
	if(msg.author.bot || !msg.content.startsWith(prefix)) return;
	let args = msg.content.split(' ').map(a => a.toLowerCase());
	let command = args.shift().slice(prefix.length).toLowerCase();
	if(['sub', 'subreddit', 'reddit'].includes(command)){
		if(!args[0]) return msg.reply('You must specify a subreddit.')
		const url = `https://www.reddit.com/r/${args[0]}/${args[1] || 'hot'}.json`;
		try{

			let children = (await get(url)).body.data.children.filter(s => !s.data.stickied && !s.data.is_video);

			if(args[2] !== 'yes' && args[2] !== 'nsfw') children = children.filter(s => !s.data.over_18)

			let post = children[Math.floor(Math.random() * children.length)].data;

			let d = new Date(0);
			d.setUTCSeconds(post.created_utc);

			let embed = new RichEmbed()
							.setAuthor(`/u/${post.author}`, null, `https://www.reddit.com/u/${post.author}`)
							.setColor('RANDOM')
							.setFooter(`${post.score} points, ${post.num_comments} comments; posted on /${post.subreddit_name_prefixed} at ${d}`)

			if(post.selftext)
				embed.addField(post.title, `${post.selftext}\n\n[Permalink](https://www.reddit.com${post.permalink})`);
			else
				embed.setImage(post.media ? post.media.oembed.url : post.preview.images[0].source.url).setDescription(post.title + '[google][https://google.com]');
			
			let m = await msg.channel.send({ embed });

			await m.react('🗑');
			
			const collector = m.createReactionCollector(
  				(reaction, user) => reaction.emoji.name === '🗑' && user.id === msg.author.id,
  				{ time: 5000 }
			);

			collector.on('collect', () => m.delete());
			collector.on('end', () => { 
				if(m) m.clearReactions().catch(console.error) 
			});

		}catch(err){
			console.log(err);
			msg.reply('There was an error.')
		}

	}else if(command === 'help'){
		msg.channel.send('Hi, I\'m a small Discord bot that fetches reddit posts. To use me, type `r!sub [subreddit] [new/hot/top, hot by default] [nsfw(yes/no, no by default)]`.\nTo join the official Discord server, click this link: https://discord.gg/3dFEEA4')
	}else if(command === 'invite'){
		msg.channel.send('To invite me to your server, click this link: https://bit.ly/redcord');
	}
})

client.login(process.env.TOKEN);