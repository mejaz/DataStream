import Head from 'next/head'
import {useEffect, useState} from "react";

export default function Home() {
	const [prompt, setPrompt] = useState('')
	const [response, setResponse] = useState('')
	const [generating, setGenerating] = useState(false)

	const handleChange = (e) => {
		setPrompt(e.target.value)
	}

	const handleSubmit = async (e) => {
		try {

			// check if prompt is empty
			if(prompt.trim().length === 0) {
				alert('prompt cannot be empty')
				return
			}

			e.preventDefault()
			setGenerating(true)
			setResponse('')

			// make a POST call to our api route
			let res = await fetch('/api/generate', {
				method: 'POST',
				headers: {
					'Content-type': 'application/json',
				},
				body: JSON.stringify({prompt})
			})

			if (res.ok) {
				// https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader
				const reader = res.body.getReader();

				const processStream = async () => {
					while(true) {
						// .read() returns 2 properties
						const {done, value} = await reader.read()

						// if done is true
						if(done) {
							console.log('stream completed')
							setGenerating(false)
							break;
						}
						// value is a binary data in Uint8Array format, as Uint8Array is suitable data structure for binary data
						// we decode Uint8Array using TextDecoder
						let chunk = new TextDecoder('utf-8').decode(value)

						// chunk like this -> data: {"response":" sweet"}
						// we remove the 'data: ' from the chunk
						chunk = chunk.replace(/^data: /, '');

						// parse the chunk
						const parsed = JSON.parse(chunk)

						// append to the response
						setResponse((prev) => prev + parsed.response);

						// Easy Peasy!! :)
					}
				}

				processStream().catch(err => console.log('--stream error--', err))

			} else {
				alert(`error getting response`)
			}
		} catch (error) {
			alert(`error: ${error.message}`)
		}
	}

	return (
		<main>
			<Head>
				<title>DataStream</title>
			</Head>
			<h1 className={'w-full py-4 bg-blue-400 text-center font-semibold text-3xl text-white'}>Data Stream</h1>
			<div className={"px-4 md:px-0 max-w-3xl mx-auto mt-20 flex flex-col justify-center items-center"}>
				<form onSubmit={handleSubmit} className={'w-[80%] space-y-2 flex flex-col mr-auto'}>
					<label htmlFor={'prompt'}>Enter a prompt</label>
					<input id={'prompt'} name={'prompt'} type={'text'} onChange={handleChange}
								 className={'border border-purple-500 py-2 px-4 rounded-md'} placeholder={'Type here...'}/>
					<div className={'text-right'}>
						<button
							disabled={generating}
							type={'submit'}
							className={'px-2 py-1 bg-blue-400 rounded-md text-white disabled:bg-blue-300 hover:bg-blue-500 disabled:cursor-not-allowed'}
						>Submit</button>
					</div>
				</form>
				<div className={"h-48 mt-4 w-full p-4 border border-purple-500 rounded-md overflow-auto"}>
					{
						response
							? response
							: <h2 className={'h-full flex justify-center items-center'}>No Response</h2>
					}
				</div>
			</div>
		</main>
	)
}
