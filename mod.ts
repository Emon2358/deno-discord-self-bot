// deno-lint-ignore-file no-explicit-any no-unused-vars
// 必要なパッケージをインポート
import { readLines } from "https://deno.land/std@0.177.0/io/mod.ts";

// 起動時間を記録
const startTime = new Date();

// ユーザー入力を取得する関数
async function getUserInput(): Promise<{
  email: string;
  password: string;
  channelId: string;
}> {
  const reader = readLines(Deno.stdin);

  console.log("Discord email:");
  const email = (await reader.next()).value || "";

  console.log("Discord password:");
  const password = (await reader.next()).value || "";

  console.log("Enter the Discord channel ID:");
  const channelId = (await reader.next()).value || "";

  return { email, password, channelId };
}

// Discord APIにログインする関数
async function loginToDiscord(
  email: string,
  password: string
): Promise<string> {
  const response = await fetch("https://discord.com/api/v9/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to login");
  }

  const data = await response.json();
  return data.token;
}

// ボットの状態を設定する関数
async function setStatus(
  token: string,
  status: "online" | "idle" | "dnd" | "invisible"
): Promise<void> {
  const response = await fetch(
    "https://discord.com/api/v9/users/@me/settings",
    {
      method: "PATCH",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to set ${status} status: ${response.statusText}`);
  }
}

// メッセージを送信する関数
async function sendMessage(
  channelId: string,
  content: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `https://discord.com/api/v9/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send message");
  }
}

// メッセージ編集機能
async function editMessage(
  channelId: string,
  messageId: string,
  content: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `https://discord.com/api/v9/channels/${channelId}/messages/${messageId}`,
    {
      method: "PATCH",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  );
  if (!response.ok) throw new Error("Failed to edit message");
}

// チャンネルのメッセージを取得する関数
async function getChannelMessages(
  channelId: string,
  token: string
): Promise<any[]> {
  const response = await fetch(
    `https://discord.com/api/v9/channels/${channelId}/messages?limit=1`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  return await response.json();
}

// サーバー情報を取得する関数
async function getServerInfo(token: string, serverId: string): Promise<any> {
  const response = await fetch(
    `https://discord.com/api/v9/guilds/${serverId}?with_counts=true`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error fetching server info:", errorText);
    throw new Error("Failed to fetch server info");
  }

  return await response.json();
}

// ユーザー情報を取得する関数（バナー画像付き）
async function getUserInfo(token: string, userId: string): Promise<any> {
  const response = await fetch(`https://discord.com/api/v9/users/${userId}`, {
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  const userInfo = await response.json();

  const bannerUrl = userInfo.banner
    ? `https://cdn.discordapp.com/banners/${userInfo.id}/${userInfo.banner}.png`
    : "なし";

  return {
    ...userInfo,
    bannerUrl,
  };
}

// 自分のアバターを表示する関数
async function getUserAvatar(token: string): Promise<string> {
  const response = await fetch("https://discord.com/api/v9/users/@me", {
    headers: { Authorization: token },
  });

  if (!response.ok) throw new Error("Failed to fetch user data");
  const data = await response.json();
  return data.avatar
    ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
    : "No avatar";
}

// ユーザーにDMを送る関数
async function sendDM(
  userId: string,
  content: string,
  token: string
): Promise<void> {
  const response = await fetch(
    "https://discord.com/api/v9/users/@me/channels",
    {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: userId }),
    }
  );

  if (!response.ok) throw new Error("Failed to create DM channel");
  const dmChannel = await response.json();
  await sendMessage(dmChannel.id, content, token);
}

// 起動時間を取得する関数
function getUptime(): string {
  const now = new Date();
  const uptimeMilliseconds = now.getTime() - startTime.getTime();
  const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  return `${hours}時間${minutes}分${seconds}秒`;
}

// メイン関数
async function main() {
  try {
    const { email, password, channelId } = await getUserInput();
    const token = await loginToDiscord(email, password);

    console.log("Successfully logged in!");

    // 特別なオンライン状態に変更
    await setStatus(token, "dnd");

    console.log(`Bot is running in channel ID: ${channelId}`);

    Deno.addSignalListener("SIGINT", async () => {
      console.log("Logging out...");
      await setStatus(token, "invisible");
      Deno.exit(0);
    });

    while (true) {
      const messages = await getChannelMessages(channelId, token);

      if (messages.length > 0) {
        const lastMessage = messages[0];
        const content = lastMessage.content.trim().toLowerCase();

        if (content === "!ping") {
          const uptime = getUptime();
          await sendMessage(channelId, `Pong! 稼働時間: ${uptime}`, token);
        } else if (content === "!xlost") {
          await sendMessage(channelId, "xlost は男の娘だからxlost は男の娘だから オナニーの時は ローター派？指派？ 天才ハッカーだかっらローター派？ローターの振動を最大に上げて 自分のまんこに入れて まんこにDDosしたら絶頂 潮吹きしたら オナニーに快感覚えたxLostは いろんなキメモノ混ぜ混ぜ 経血と愛液と潮 キメションアイスティー ローターにたっぷり染み込ませ ケツアナに入れて 絶頂ミラクル大痙攣 xLostは男の娘だから xLostは男の娘だから", token);
        } else if (content.startsWith("!server ")) {
          const serverId = content.slice(8);
          const serverInfo = await getServerInfo(token, serverId);
          const serverDetails = `
サーバー名: ${serverInfo.name}
サーバーID: ${serverInfo.id}
メンバー数: ${serverInfo.approximate_member_count}
オンラインメンバー数: ${serverInfo.approximate_presence_count}
作成日: ${new Date(serverInfo.id / 4194304 + 1420070400000).toISOString()}
アイコンURL: ${
            serverInfo.icon
              ? `https://cdn.discordapp.com/icons/${serverInfo.id}/${serverInfo.icon}.png`
              : "なし"
          }
ブーストレベル: ${serverInfo.premium_tier}
`;
          await sendMessage(channelId, serverDetails, token);
        } else if (content.startsWith("!user ")) {
          const userId = content.slice(6);
          const userInfo = await getUserInfo(token, userId);
          const userDetails = `
ユーザーネーム: ${userInfo.username}#${userInfo.discriminator}
ユーザーID: ${userInfo.id}
アイコンURL: ${
            userInfo.avatar
              ? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png`
              : "なし"
          }
バナーURL: ${userInfo.bannerUrl}
`;
          await sendMessage(channelId, userDetails, token);
        } else if (content.startsWith("!say ")) {
          const messageContent = content.slice(5);
          await sendMessage(channelId, messageContent, token);
        } else if (content === "!help") {
          const helpMessage = `
利用可能なコマンド:
!ping: Ping コマンド。稼働時間を表示。
!xlost: 特別なメッセージを送信。
!server [サーバーID]: サーバーの情報を表示。
!user [ユーザーID]: ユーザーの情報を表示（バナー付き）。
!say [メッセージ]: チャネルにメッセージを送信。
!edit [メッセージID] [新しいメッセージ]: メッセージを編集。※セルボ自身のメッセージのみ
`;
          await sendMessage(channelId, helpMessage, token);
        } else if (content.startsWith("!edit ")) {
          const [messageId, ...newContent] = content.slice(6).split(" ");
          const newMessage = newContent.join(" ");
          await editMessage(channelId, messageId, newMessage, token);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();

