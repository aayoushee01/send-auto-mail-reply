const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

const credentials = JSON.parse(fs.readFileSync('credentials.json'));

const oAuth2Client = new OAuth2Client(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

const gmail = google.gmail({
  version: 'v1',
  auth: oAuth2Client,
});

const userId = 'me';
const labelName = 'Vacation Auto Replies';

async function listMessages() {
  console.log('Listing unread messages');
  try {
    const res = await gmail.users.messages.list({ userId, q: 'is:unread', maxResults: 2 });
    return res.data.messages || [];
  } catch (error) {
    console.error('Error listing unread messages:', error);
    return [];
  }
}

async function getMessageThread(messageId) {
  try {
    const res = await gmail.users.messages.get({ userId, id: messageId });
    return res.data.threadId;
  } catch (error) {
    console.error('Error getting message thread:', error);
    return null;
  }
}

async function listSentMessagesInThread(threadId) {
  try {
    const res = await gmail.users.messages.list({ userId, q: `in:sent from:me thread:${threadId}` });
    return res.data.messages || [];
  } catch (error) {
    console.error('Error listing sent messages in thread:', error);
    return [];
  }
}

async function sendAutoReply(messageId, recipientEmail) {
  try {
    const emailContent = 'Thank you for your email. I am currently on vacation and will respond as soon as possible.';
    
    await gmail.users.messages.send({
      userId,
      requestBody: {
        raw: Buffer.from(
          `From: aayousheeahlawat05@gmail.com\r\n` +
          `To: ${recipientEmail}\r\n` +
          `Subject: Re: On Vacation Auto Reply\r\n` +
          `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
          `${emailContent}`
        ).toString('base64'),
      },
      threadId: messageId,
    });
    const label = await getLabel(labelName);
    if (label == null) {
      await createLabel(labelName);
    }

    await gmail.users.messages.modify({
      userId,
      id: messageId,
      requestBody: { removeLabelIds: ['UNREAD'], addLabelIds: [label] },
    });
    console.log('Auto-reply sent.');
  } catch (error) {
    console.error('Error sending auto-reply:', error);
  }
}

async function getLabel(labelName) {
  try {
    existingLabel = hasLabel(labelName);
    if (existingLabel) {
      return existingLabel.id;
    }
  } catch (error) {
    return null;
  }
}

async function createLabel(labelName) {
  try {
    await gmail.users.labels.create({
      userId,
      requestBody: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });
    console.log(`Label '${labelName}' created.`);
  } catch (error) {
    console.error('Error creating label:', error);
  }
}

async function checkIfReplied(threadId) {
  try {
    const sentMessages = await listSentMessagesInThread(threadId);
    return sentMessages.length > 0;
  } catch (error) {
    console.error('Error checking sent messages in thread:', error);
    return false;
  }
}
async function hasLabel(labelName) {
  try {
    const res = await gmail.users.labels.list({ userId: 'me' });
    const labels = res.data.labels;
    const label = labels.find((label) => label.name === labelName);
    return label ? label.id : null;
  } catch (error) {
    console.error('Error fetching label:', error);
    return null;
  }
}

async function hasThreadLabel(threadId, labelId) {
  try {
    if (!labelId) {
      console.error('Label ID not found.');
      return false;
    }

    const thread = await gmail.users.threads.get({ userId, id: threadId });
    const labels = thread.data.messages[0].labelIds;
    return labels.includes(labelId);
  } catch (error) {
    console.error('Error checking label on thread:', error);
    return false;
  }
}

async function processThreads() {
  try {
    const unreadMessages = await listMessages();
    const autoReplyLabelId = await hasLabel(labelName);
    for (const message of unreadMessages) {
      const threadId = await getMessageThread(message.id);
      
      if (threadId) {
        const replied = await checkIfReplied(threadId);
        const hasAutoReplyLabel = await hasThreadLabel(threadId, autoReplyLabelId);
        if (!replied && !hasAutoReplyLabel) {
          console.log('Sending auto-reply to thread:', threadId);
          const fullMessage = await gmail.users.messages.get({ userId, id: message.id });

          if (fullMessage && fullMessage.data) {
            const headers = fullMessage.data.payload.headers || [];
            const originalSenderHeader = headers.find(header => header.name === 'From');

            if (originalSenderHeader && originalSenderHeader.value) {
              const originalSender = originalSenderHeader.value;
              const recipientEmail = originalSender.substring(originalSender.lastIndexOf("<") + 1, originalSender.lastIndexOf(">"));

              await sendAutoReply(message.id, recipientEmail);
            } else {
              console.error('Original sender information not found.');
            }
          } else {
            console.error('Full message data not available.');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing threads:', error);
  }
}

async function startProcessing() {
  console.log('Processing messages...');
  setInterval(async () => {
    await processThreads();
  }, Math.floor(Math.random() * (120000 - 45000)) + 45000);
}

async function authorizeAndStart() {
  try {
    const token = JSON.parse(fs.readFileSync('token.json'));
    oAuth2Client.setCredentials({ refresh_token: token.refresh_token });
    startProcessing();
  } catch (error) {
    console.error('Error authorizing:', error);
  }
}

authorizeAndStart();
