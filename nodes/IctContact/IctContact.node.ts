import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { ictContactApiRequest } from './GenericFunctions';

export class IctContact implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ICTContact',
		name: 'ictContact',
		icon: { light: 'file:ictcontact.svg', dark: 'file:ictcontact.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Run ICTContact campaigns, users and contacts from a workflow',
		defaults: {
			name: 'ICTContact',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'ictContactApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Campaign', value: 'campaign' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'User', value: 'user' },
				],
				default: 'campaign',
			},

			// Campaign
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['campaign'] } },
				options: [
					{
						name: 'Add Contact',
						value: 'addContact',
						description: 'Add one contact to a campaign dial list',
						action: 'Add a contact to a campaign',
					},
					{
						name: 'Get Result',
						value: 'result',
						action: 'Get the result of a campaign',
					},
					{
						name: 'Get Status',
						value: 'status',
						action: 'Get the status of a campaign',
					},
					{
						name: 'Get Summary',
						value: 'summary',
						description: 'Per contact outcome: busy, congestion, no response, failed',
						action: 'Get a campaign summary',
					},
					{
						name: 'Import Contacts',
						value: 'import',
						description: 'Upload a CSV of contacts into a campaign',
						action: 'Import contacts into a campaign',
					},
					{ name: 'List', value: 'list', action: 'List many campaigns' },
					{ name: 'Start', value: 'start', action: 'Start a campaign' },
					{ name: 'Stop', value: 'stop', action: 'Stop a campaign' },
				],
				default: 'start',
			},
			{
				displayName: 'Campaign ID',
				name: 'campaignId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['campaign'],
						operation: ['start', 'stop', 'status', 'summary', 'result', 'addContact', 'import'],
					},
				},
			},
			{
				displayName: 'Owner User ID',
				name: 'usrId',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['campaign'], operation: ['summary', 'result'] },
				},
				description: 'ID of the user who owns the campaign',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['campaign'], operation: ['result'] } },
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['campaign'], operation: ['addContact'] } },
			},
			{
				displayName: 'Contact Fields',
				name: 'contactFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['campaign'], operation: ['addContact'] } },
				options: [
					{ displayName: 'Address', name: 'address', type: 'string', default: '' },
					{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '' },
					{ displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
					{ displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
				],
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				default: 'data',
				displayOptions: { show: { resource: ['campaign'], operation: ['import'] } },
				description: 'Name of the binary field holding the contacts CSV',
			},

			// Contact
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contact'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a contact' },
					{ name: 'Delete', value: 'delete', action: 'Delete a contact' },
				],
				default: 'create',
			},
			{
				displayName: 'Contact Group ID',
				name: 'contactGroupId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
			},
			{
				displayName: 'Fields',
				name: 'contactFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
				options: [
					{ displayName: 'Address', name: 'address', type: 'string', default: '' },
					{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '' },
					{ displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
					{ displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
				],
			},
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['contact'], operation: ['delete'] } },
			},

			// User
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['user'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a user' },
					{ name: 'Delete', value: 'delete', action: 'Delete a user' },
					{ name: 'Get', value: 'get', action: 'Get a user' },
					{ name: 'List Roles', value: 'listRoles', action: 'List available roles' },
					{ name: 'Update', value: 'update', action: 'Update a user' },
				],
				default: 'create',
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['get', 'update', 'delete'],
					},
				},
			},
			{
				displayName: 'User Fields',
				name: 'userFields',
				type: 'json',
				default: '{}',
				displayOptions: { show: { resource: ['user'], operation: ['create', 'update'] } },
				description: 'User record as a JSON object, for example username, password, email, role',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const parseJson = (raw: unknown, field: string, itemIndex: number): IDataObject => {
			if (typeof raw === 'object' && raw !== null) return raw as IDataObject;
			try {
				return JSON.parse((raw as string) || '{}') as IDataObject;
			} catch {
				throw new NodeOperationError(this.getNode(), `${field} is not valid JSON`, { itemIndex });
			}
		};

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: unknown;

				if (resource === 'campaign') {
					const campaignId = this.getNodeParameter('campaignId', i, '') as string;

					if (operation === 'start') {
						responseData = await ictContactApiRequest.call(this, 'Campaign_Start', {
							campaign_id: campaignId,
						});
					} else if (operation === 'stop') {
						responseData = await ictContactApiRequest.call(this, 'Campaign_Stop', {
							campaign_id: campaignId,
						});
					} else if (operation === 'status') {
						responseData = await ictContactApiRequest.call(this, 'Campaign_Status', {
							campaign_id: campaignId,
						});
					} else if (operation === 'summary') {
						responseData = await ictContactApiRequest.call(this, 'Campaign_Summary', {
							campaign_id: campaignId,
							usr_id: this.getNodeParameter('usrId', i, '') as string,
						});
					} else if (operation === 'result') {
						responseData = await ictContactApiRequest.call(this, 'Campaign_Result', {
							campaign_id: campaignId,
							usr_id: this.getNodeParameter('usrId', i, '') as string,
							status: this.getNodeParameter('status', i, '') as string,
						});
					} else if (operation === 'list') {
						responseData = await ictContactApiRequest.call(this, 'Campaign_List');
					} else if (operation === 'addContact') {
						responseData = await ictContactApiRequest.call(this, 'Campaign_Contact_Create', {
							campaign_id: campaignId,
							contact_id: {
								phone: this.getNodeParameter('phone', i) as string,
								...(this.getNodeParameter('contactFields', i, {}) as IDataObject),
							},
						});
					} else if (operation === 'import') {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						responseData = await ictContactApiRequest.call(
							this,
							'Campaign_Contact_Import',
							{ campaign_id: campaignId, type: 'file' },
							{
								name: 'source_file',
								fileName: binaryData.fileName || 'contacts.csv',
								mimeType: binaryData.mimeType || 'text/csv',
								buffer,
							},
						);
					}
				} else if (resource === 'contact') {
					if (operation === 'create') {
						responseData = await ictContactApiRequest.call(this, 'Contact_Create', {
							contact_group_id: this.getNodeParameter('contactGroupId', i) as string,
							contact: {
								phone: this.getNodeParameter('phone', i) as string,
								...(this.getNodeParameter('contactFields', i, {}) as IDataObject),
							},
						});
					} else if (operation === 'delete') {
						responseData = await ictContactApiRequest.call(this, 'Contact_Delete', {
							contact_id: this.getNodeParameter('contactId', i) as string,
						});
					}
				} else if (resource === 'user') {
					if (operation === 'create') {
						responseData = await ictContactApiRequest.call(this, 'User_Create', {
							user: parseJson(this.getNodeParameter('userFields', i, '{}'), 'User Fields', i),
						});
					} else if (operation === 'update') {
						responseData = await ictContactApiRequest.call(this, 'User_Update', {
							user_id: this.getNodeParameter('userId', i) as string,
							user: parseJson(this.getNodeParameter('userFields', i, '{}'), 'User Fields', i),
						});
					} else if (operation === 'get') {
						responseData = await ictContactApiRequest.call(this, 'User_Get', {
							user_id: this.getNodeParameter('userId', i) as string,
						});
					} else if (operation === 'delete') {
						responseData = await ictContactApiRequest.call(this, 'User_Delete', {
							user_id: this.getNodeParameter('userId', i) as string,
						});
					} else if (operation === 'listRoles') {
						responseData = await ictContactApiRequest.call(this, 'User_Role_List');
					}
				}

				if (responseData === undefined) {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for resource "${resource}"`,
						{ itemIndex: i },
					);
				}

				const rows = Array.isArray(responseData)
					? (responseData as IDataObject[])
					: [responseData as IDataObject];

				for (const row of rows) {
					returnData.push({
						json: typeof row === 'object' && row !== null ? row : { result: row },
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				// Errors we raised ourselves already carry a useful message, so only
				// raw transport failures get wrapped.
				throw error instanceof NodeApiError || error instanceof NodeOperationError
					? error
					: new NodeApiError(this.getNode(), error as JsonObject);
			}
		}

		return [returnData];
	}
}
