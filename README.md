# n8n-nodes-ictcontact

An n8n community node for [ICTContact](https://ictcontact.com), the contact centre and autodialer platform from [ICT Innovations](https://ictinnovations.com). Start and stop campaigns, pull results, load contacts and manage users straight from a workflow.

The same node drives [ICTDialer.com](https://ictdialer.com), which is the hosted edition of ICTContact. Point the base URL at your account.

## Install

In n8n, go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-ictcontact
```

Self-hosted n8n only. n8n Cloud doesn't allow unverified community nodes that make arbitrary HTTP calls.

Manual install:

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-ictcontact
```

Restart n8n afterwards.

## Credential

| Field | Value |
|-------|-------|
| Base URL | Your server without the `/rest` suffix |
| Authentication | Username and password (default) or API Key |
| API Key | Found in ICTContact under **My Account → API Key** |
| Ignore SSL Issues | Turn this on if your box still runs a self-signed certificate |

Hit **Test** after filling it in. The test calls `User_Role_List`, which takes no arguments and every account can reach.

## Operations

**Campaign**
- Start, Stop, Get Status, Get Summary, Get Result, List, Create Contact, Import Contacts (upload a CSV as binary data)

**Contact**
- Create, Delete

**User**
- Create, Update, Get, Delete, List Roles

## It isn't shaped like REST

Every call is a POST to `/rest/<Method_Name>` carrying form fields, so the node maps each operation to a method name rather than to a URL path. The CSV import sends multipart; everything else sends a urlencoded body, which the server reads identically.

## There is no webhook you can subscribe to

ICTContact ships a Push Call Status addon, but it is configured per campaign in the ICTContact UI, not subscribed to over the API. So a workflow can't be triggered by call events from here. Poll **Campaign → Get Status** or **Get Result** on a Schedule Trigger instead.

## Example: launch a campaign from a form submission

```
Webhook  →  ICTContact (Contact: Create)  →  ICTContact (Campaign: Start)
```

## Compatibility

Tested against n8n 1.x. Needs Node.js 20.15 or newer, which is what n8n itself requires.

## Related nodes

- [n8n-nodes-ictbroadcast](https://www.npmjs.com/package/n8n-nodes-ictbroadcast) for [ICTBroadcast](https://ictbroadcast.com)
- [n8n-nodes-ictcore](https://www.npmjs.com/package/n8n-nodes-ictcore) for [ICTFax](https://ictfax.com), [ICTPBX](https://ictpbx.com) and the [open source ICTDialer](https://github.com/ictinnovations/ictdialer)

## Links

- [ICTContact REST API guide](https://www.ictcontact.com/using-rest-based-api-to-integrate-ictcontact-with-third-party-application-and-autodialer-automation/)
- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
