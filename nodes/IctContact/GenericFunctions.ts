import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

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
	let payload = response;
	if (typeof payload === 'string') {
		try {
			payload = JSON.parse(payload);
		} catch {
			return { result: payload };
		}
	}

	// A call that blew up server side answers HTTP 200 with a bare error object
	// instead of the envelope, so without this it would arrive as a valid row.
	if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'ErrorMessage' in payload) {
		throw new NodeOperationError(
			this.getNode(),
			`ICTContact failed ${method}: ${String((payload as IDataObject).ErrorMessage)}`,
		);
	}

	// Every call comes back as a [ok, payload] envelope with HTTP 200 attached,
	// even when it failed, so that boolean is the only success signal there is.
	if (Array.isArray(payload) && payload.length === 2 && typeof payload[0] === 'boolean') {
		if (!payload[0]) {
			throw new NodeOperationError(
				this.getNode(),
				`ICTContact refused ${method}: ${String(payload[1] ?? 'no reason given')}`,
			);
		}
		return payload[1];
	}

	return payload;
}
