import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

export interface Attachment {
	name: string;
	fileName: string;
	mimeType: string;
	buffer: Buffer;
}

/**
 * ICTContact is not shaped like REST. Every call is a POST to /rest/<Method>
 * carrying form fields, and the method name is the whole API surface.
 */
export async function ictContactApiRequest(
	this: IExecuteFunctions,
	method: string,
	parameters: IDataObject = {},
	attachment?: Attachment,
): Promise<any> {
	const credentials = await this.getCredentials('ictContactApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');

	const fields: Array<[string, string]> = [];
	for (const [key, value] of Object.entries(parameters)) {
		if (value === undefined || value === null || value === '') continue;
		fields.push([key, typeof value === 'object' ? JSON.stringify(value) : String(value)]);
	}

	// Only the CSV import carries a file, and only that call needs multipart. PHP
	// reads a urlencoded body into $_POST just the same, so the plain calls avoid
	// the heavier encoding.
	let body: FormData | URLSearchParams;
	if (attachment) {
		const form = new FormData();
		for (const [key, value] of fields) form.append(key, value);
		form.append(
			attachment.name,
			new Blob([attachment.buffer], { type: attachment.mimeType }),
			attachment.fileName,
		);
		body = form;
	} else {
		body = new URLSearchParams(fields);
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}/rest/${method}`,
		body,
		json: true,
		headers: {
			Accept: 'application/json',
		},
	};

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'ictContactApi',
		options,
	);

	// Some methods answer with a JSON string rather than a JSON body.
	if (typeof response === 'string') {
		try {
			return JSON.parse(response);
		} catch {
			return { result: response };
		}
	}
	return response;
}
