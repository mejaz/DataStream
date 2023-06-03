import openai from "@/openAiServices";

export default function handler(req, res) {
	if (req.method === 'POST') {
		// Set the appropriate headers for Server Sent Events - SSE
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');

		// extract the prompt
		const {prompt} = req.body

		// no await
		const response = openai.createCompletion({
			model: "text-davinci-003",
			prompt,
			max_tokens: 50,
			temperature: 0.7,
			stream: true,  // mandatory for streaming
		}, {responseType: 'stream'});

		response.then(resp => {

			// we are listening to the event name: 'data'
			resp.data.on('data', data => {

				// data is a buffer
				// data.toString() converts to a readable string like below:
				// data.toString() gives this -> data: {"id":"cmpl-7MwK...","object":"text_completion","created":1685702342,"choices":[{"text":" joy","index":0,"logprobs":null,"finish_reason":null}],"model":"text-davinci-003"}
				const lines = data.toString().split('\n').filter(line => line.trim() !== '');

				// lines is an array of below lines
				for (const line of lines) {

					// line is this without \n in the end ->: data: {"id":"cmpl-7MwTOu3fnOCKxMMYvBmrLPfZ2hRxJ","object":"text_completion","created":1685702342,"choices":[{"text":" it","index":0,"logprobs":null,"finish_reason":null}],"model":"text-davinci-003"}
					// replace 'data: ' with an empty string
					const message = line.replace(/^data: /, '');

					// the last line will have line -> data: [DONE]
					if (message === '[DONE]') {
						res.end();
						return
					}

					// message is this unless [DONE] -> {"id":"cmpl-7MwTOu3fnOCKxMMYvBmrLPfZ2hRxJ","object":"text_completion","created":1685702342,"choices":[{"text":" it","index":0,"logprobs":null,"finish_reason":null}],"model":"text-davinci-003"}
					const parsed = JSON.parse(message)

					// parse to json object
					const data = {response: parsed.choices[0].text}

					// adding "data: " as it is a server sent event
					const writeData = `data: ${JSON.stringify(data)}`

					// write the data to stream
					res.write(writeData)
				}
			});
		})

		// Cleanup function
		req.on('close', () => {
			res.end();
		});
	} else {
    // Handle other HTTP methods or return an appropriate error response
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
