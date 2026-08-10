import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class IctContactApi implements ICredentialType {
	name = 'ictContactApi';

	displayName = 'ICTContact API';

	documentationUrl =
		'https://www.ictcontact.com/using-rest-based-api-to-integrate-ictcontact-with-third-party-application-and-autodialer-automation/';

	icon: Icon = { light: 'file:icons/ictcontact.svg', dark: 'file:icons/ictcontact.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://contact.example.com',
			required: true,
			description:
				'Your ICTContact address without the /rest suffix. ICTDialer.com is the hosted edition of ICTContact, so use this credential for it too.',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'options',
			options: [
				{
					name: 'API Key',
					value: 'apiToken',
				},
				{
					name: 'Username and Password',
					value: 'basic',
				},
			],
			default: 'basic',
		},
		{
			displayName: 'API Key',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				show: {
					authentication: ['apiToken'],
				},
			},
			description: 'Find this in ICTContact under My Account, API Key',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authentication: ['basic'],
				},
			},
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				show: {
					authentication: ['basic'],
				},
			},
		},
		{
			displayName: 'Ignore SSL Issues',
			name: 'ignoreSslIssues',
			type: 'boolean',
			default: false,
			description: 'Whether to accept a self-signed certificate',
		},
	];

	/**
	 * The username and password go in the POST body, not an Authorization header.
	 * ICTContact answers HTTP Basic with 401 on every endpoint, so sending a Basic
	 * header instead of body fields breaks every call.
	 */
	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		requestOptions.skipSslCertificateValidation = credentials.ignoreSslIssues as boolean;
		requestOptions.headers = { ...requestOptions.headers };

		if (credentials.authentication === 'apiToken') {
			requestOptions.headers.Authorization = `Bearer ${credentials.apiToken as string}`;
			return requestOptions;
		}

		const username = credentials.username as string;
		const password = credentials.password as string;

		if (requestOptions.body instanceof FormData) {
			requestOptions.body.set('username', username);
			requestOptions.body.set('password', password);
		} else if (requestOptions.body instanceof URLSearchParams) {
			requestOptions.body.set('username', username);
			requestOptions.body.set('password', password);
		} else {
			// The credential test sends no body at all.
			requestOptions.body = new URLSearchParams({ username, password });
		}

		return requestOptions;
	}

	// User_Role_List takes no arguments and every account can call it, which makes
	// it the cheapest way to prove the base URL and the login are both good.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl.replace(/\\/+$/, "") }}',
			url: '/rest/User_Role_List',
			method: 'POST',
		},
	};
}
