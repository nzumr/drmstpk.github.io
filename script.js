//------------------------------------------------------------------------------
//	ブラウザのAIが利用できるかチェック
//------------------------------------------------------------------------------
let session = false;
async function check_ai()
{
	let ai_available = false;
	if( window.ai )
	{
		const canCreate = await window.ai.canCreateTextSession();
		if( canCreate !== "no" && canCreate !== "after-download" )
		{
			ai_available = true;
		}
	}

	if( ai_available )
	{
		const chat_area = document.getElementById('chat_area');
		chat_area.classList.remove('hidden');
		session = await window.ai.createTextSession();
	}
	else
	{
		const howto = document.getElementById('howto');
		howto.classList.remove('hidden');
	}

	const loading = document.getElementById('loading');
	loading.classList.add('hidden');
}
check_ai();

//------------------------------------------------------------------------------
//	応答用メッセージ
//------------------------------------------------------------------------------
let message_id = 0;
const messages =
[
	{
		message: 'こんにちは！\n\nあなたの志望動機の文章作成をサポートします。',
	},
	{
		answer_key: 'gyoukai',
		message: 'あなたが志望する業界は何ですか？\n（例：IT業界、飲食業界、インフラ）',
	},
	{
		answer_key: 'reason',
		message: 'なぜその業界に興味を持った/共感したのか、その背景について詳しく教えてください。\n\n（例：幼い頃からテクノロジーに触れる機会が多く、ITの進化に魅了されてきました。特に、デジタル技術が人々の生活を便利にし、課題解決に貢献できる点に共感し、この分野で新しい価値を創造したいと考えています。）',
	},
	{
		message:'以下は、あなたの志望動機の例文です。\n',
		prompt: '以上のことをまとめて、{{gyoukai}}の企業に対しての、志望動機を500文字以上で作成してください。もし、箇条書きをするのであれば「・」を文の先頭に入れてください。',
	},
];

//	利用者の回答
const answers = {};

//	HTML要素
const history = document.getElementById('history');
const send_button = document.getElementById('send_button');
const answer_textarea = document.getElementById('answer_textarea');
const generating = document.getElementById('generating');

//------------------------------------------------------------------------------
//	メッセージの追加
//------------------------------------------------------------------------------
function add_message( message_, me_ = false )
{
	const balloon = document.createElement('div');
	balloon.classList.add('balloon');
	if( me_ )
	{
		balloon.classList.add('me');
	}
	balloon.textContent = message_;
	history.appendChild(balloon);

	setTimeout(function()
	{
		//	メッセージを表示
		balloon.classList.add('show');

		//	履歴の最下部にスクロール
		history.scrollTop = history.scrollHeight;
	}, 100);
}

//------------------------------------------------------------------------------
//	ボットのメッセージを追加
//------------------------------------------------------------------------------
async function bot_next_message()
{
	const next = messages[message_id];
	let message = next.message;
	let prompt = next.prompt;

	//	回答を置換
	for( const key in answers )
	{
		message = message.replace('{{' + key + '}}', answers[key]);
		if( prompt )
		{
			prompt = prompt.replace('{{' + key + '}}', answers[key]);
		}
	}
	add_message(message);

	if( prompt )
	{
		generating.classList.remove('hidden');
		session.prompt(prompt).then(function(response)
		{
			generating.classList.add('hidden');
			answers[next.answer_key] = response;
			add_message(response);
		});
	}
}

//------------------------------------------------------------------------------
//	利用者の回答を追加
//------------------------------------------------------------------------------
send_button.addEventListener('click', function()
{
	const answer = answer_textarea.value;
	if( answer.length == 0 )
	{
		return;
	}

	//	回答を追加
	const message = messages[message_id];
	answers[message.answer_key] = answer;
	add_message(answer, true);
	answer_textarea.value = '';

	if( message_id < messages.length - 1 )
	{
		message_id++;
		setTimeout(bot_next_message, 500);
	}
});

//	初回のメッセージ表示
bot_next_message();
setTimeout(function()
{
	message_id++;
	bot_next_message();
}, 500);

//------------------------------------------------------------------------------
//	テキストエリアでEnterキーで送信、Shift Enterで改行
//------------------------------------------------------------------------------
answer_textarea.addEventListener('keydown', function(e_)
{
	if( e_.key === 'Enter' && e_.shiftKey )
	{
		return;
	}
	else if( e_.key === 'Enter' )
	{
		send_button.click();
		e_.preventDefault();
	}
});