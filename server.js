
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const multer = require('multer')

const app = express()
const upload = multer()
const port = 5172

app.use(upload.any())
app.use(cors())
app.use(express.json())

let zohoAccessToken = '' // Variable to store the Zoho access token
let zohoTokenExpiration = 0 // Variable to store the expiration time of the access token

// Middleware to check if the Zoho access token is expired
const checkTokenExpiration = async (req, res, next) => {
	if (Date.now() >= zohoTokenExpiration) {
		try {
			const client_id = '1000.TJLR0D7KB3Y6EAC1UGX7TCZ7MR80MP'
			const client_secret = '40a4319f291bba35d2241dd2730853904e94d17680'
			const refresh_token =
				'1000.640b735a812fa2e79356f967fd615a09.2071c297a3cf8fb21c891cd5ce23a762'

			// Renew the Zoho access token
			const response = await axios.post(
				`https://accounts.zoho.com/oauth/v2/token?grant_type=refresh_token&client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			)

			zohoAccessToken = response.data.access_token
			zohoTokenExpiration = Date.now() + response.data.expires_in * 1000 // Convert seconds to milliseconds

			// Proceed to the next middleware or route handler
			next()
		} catch (error) {
			console.error('Error renewing Zoho access token:', error)
			res.status(500).send('Error renewing Zoho access token')
		}
	} else {
		// Proceed to the next middleware or route handler
		next()
	}
}

app.use('/zoho-api', checkTokenExpiration, async (req, res) => {
	try {
		if (req.method === 'GET') {
			const response = await axios.get(`https://zohoapis.com${req.url}`, {
				headers: {
					Authorization: `Bearer ${zohoAccessToken}`,
				},
			})
			res.json(response.data)
		} else if (req.method === 'POST' && !req.url.includes('/Attachments')) {
			console.log({ url: `https://zohoapis.com${req.url}` })
			const response = await axios.post(
				`https://www.zohoapis.com${req.url}`,
				req.body,
				{
					headers: {
						Authorization: `Bearer ${zohoAccessToken}`,
					},
				}
			)

			res.json(response.data) // Send the response data back to the client
		} else if (req.method === 'PUT') {
			console.log('Response dataasasa:', req.url)
			const response = await axios.put(
				`https://zohoapis.com${req.url}`,
				req.body,
				{
					headers: {
						Authorization: `Bearer ${zohoAccessToken}`,
						'Content-Type': 'application/json',
					},
				}
			)
			console.log(response.data, 'Response Data') // Log the response data for debugging

			res.json(response.data) // Send the response data back to the client
		} else if (req.method === 'POST' && req.url.includes('/Attachments')) {
			const response = await axios.post(
				`https://zohoapis.com${req.url}`,
				req.body,
				{
					headers: {
						Authorization: `Bearer ${zohoAccessToken}`,
						'Content-Type': 'multipart/form-data',
					},
				}
			)

			console.log({ res: response.data })

			// Send the response data back to the client
			res.json(response.data)
		} else if (req.method === 'DELETE') {
			const response = await axios.delete(`https://zohoapis.com${req.url}`, {
				headers: {
					Authorization: `Bearer ${zohoAccessToken}`,
					'Content-Type': 'multipart/form-data',
				},
			})

			// Send the response data back to the client
			res.json(response.data)
		}
	} catch (error) {
		console.log({ error })
		console.error('Error sending request to Zoho API:', error.message)
		res.status(500).send('Error sending the request to Zoho APIs.')
	}
})

app.get('/api/get-customer-plans', checkTokenExpiration, async (req, res) => {
	// customer id required.
	if (!req.query.customer) {
		res.json({ status: 'failure', message: 'Specify a valid customer.' })
		return
	}

	try {
		const response = await axios.get(
			`https://www.zohoapis.com/billing/v1/subscriptions?customer_id=${req.query.customer}`,
			{
				headers: {
					Authorization: `Bearer ${zohoAccessToken}`,
					Accept: 'application/json',
				},
			}
		)

		// If the response is empty,
		if (
			!response.data ||
			response.data === '' ||
			response.data.message !== 'success'
		) {
			res.json({
				status: 'failure',
				message:
					'We could not find subscription information about the specified customer.',
			})

			return
		}

		res.json({ status: 'success', plans: response.data.subscriptions })
	} catch (error) {
		console.error('Error proxying request to Zoho API:', error)
		res.status(500).send('Error proxying request to Zoho.')
	}
})

app.get(
	'/api/get-customer-invoices',
	checkTokenExpiration,
	async (req, res) => {
		// customer id required.
		if (!req.query.customer) {
			res.json({ status: 'failure', message: 'Specify a valid customer.' })
			return
		}

		try {
			const response = await axios.get(
				`https://www.zohoapis.com/billing/v1/invoices?customer_id=${req.query.customer}`,
				{
					headers: {
						Authorization: `Bearer ${zohoAccessToken}`,
						Accept: 'application/json',
					},
				}
			)

			// If the response is empty,
			if (
				!response.data ||
				response.data === '' ||
				response.data.message !== 'success'
			) {
				res.json({
					status: 'failure',
					message:
						'We could not find subscription information about the specified customer.',
				})

				return
			}

			res.json({ status: 'success', invoices: response.data.invoices })
		} catch (error) {
			console.error('Error proxying request to Zoho API:', error)
			res.status(500).send('Error proxying request to Zoho.')
		}
	}
)

app.get(
	'/api/get-customer-payments',
	checkTokenExpiration,
	async (req, res) => {
		// customer id required.
		if (!req.query.customer) {
			res.json({ status: 'failure', message: 'Specify a valid customer.' })
			return
		}

		try {
			const response = await axios.get(
				`https://www.zohoapis.com/billing/v1/payments?customer_id=${req.query.customer}`,
				{
					headers: {
						Authorization: `Bearer ${zohoAccessToken}`,
						Accept: 'application/json',
					},
				}
			)

			// If the response is empty,
			if (
				!response.data ||
				response.data === '' ||
				response.data.message !== 'success'
			) {
				res.json({
					status: 'failure',
					message:
						'We could not find subscription information about the specified customer.',
				})

				return
			}

			res.json({ status: 'success', payments: response.data.payments })
		} catch (error) {
			console.error('Error proxying request to Zoho API:', error)
			res.status(500).send('Error proxying request to Zoho.')
		}
	}
)

app.post(
	'/api/cancel-customer-plan',
	checkTokenExpiration,
	async (req, res) => {
		// subscription_id is required.
		if (!req.body.subscription_id) {
			res.json({
				status: 'failure',
				message: 'Specify a valid subscription for cancelation.',
			})
			return
		}

		const sub_id = req.body.subscription_id

		// If a cancelation reason has been provided, add that as a note.
		if (req.body.reason) {
			try {
				await axios.post(
					`https://www.zohoapis.com/billing/v1/subscriptions/${sub_id}/notes`,
					{
						description: 'Subscription Cancelation note provided by the user.',
						note: req.body.reason,
					},
					{
						headers: {
							Authorization: `Bearer ${zohoAccessToken}`,
							Accept: 'application/json',
						},
					}
				)
			} catch (error) {
				// For now, ignore the error if it fails to set a note.
			}
		}

		try {
			const response = await axios.post(
				`https://www.zohoapis.com/billing/v1/subscriptions/${sub_id}/cancel`,
				{
					cancel_at_end: !req.body.immediately ?? true,
				},
				{
					headers: {
						Authorization: `Bearer ${zohoAccessToken}`,
						Accept: 'application/json',
					},
				}
			)

			// If the response is empty,
			if (response.data === '' || response.data.code === 0) {
				res.json({
					status: 'failure',
					message:
						response.data.message ??
						'Sorry! We were unable to cancel your subscription at this time.',
				})

				return
			}

			res.json({ status: 'success' })
		} catch (error) {
			res
				.status(500)
				.send('Sorry! We were unable to cancel your subscription at this time.')
		}
	}
)

app.get('/api/get-all-plans', checkTokenExpiration, async (req, res) => {
	try {
		const response = await axios.get(
			`https://www.zohoapis.com/billing/v1/plans`,
			{
				headers: {
					Authorization: `Bearer ${zohoAccessToken}`,
					Accept: 'application/json',
				},
			}
		)

		// If the response is empty,
		if (
			!response.data ||
			response.data === '' ||
			response.data.message !== 'success'
		) {
			res.json({
				status: 'failure',
				message:
					'Sorry! We could not fetch information about the available plans.',
			})

			return
		}

		// Filter out "Inactive" plans.
		const activePlans = response.data.plans.filter(
			(plan) => plan.status === 'active'
		)

		res.json({ status: 'success', plans: activePlans })
	} catch (error) {
		console.error('Error proxying request to Zoho API:', error)
		res.status(500).send('Error proxying request to Zoho.')
	}
})

// app.post('/api/login', checkTokenExpiration, async (req, res) => {
// 	// email is required.
// 	if (!req.body.email) {
// 		res.json({ status: 'failure', message: 'Specify your email address.' })
// 		return
// 	}

// 	try {
// 		const response = await axios.get(
// 			`https://www.zohoapis.com/crm/v6/Accounts/search?criteria=(Email:equals:${req.body.email})`,
// 			{
// 				headers: {
// 					Authorization: `Bearer ${zohoAccessToken}`,
// 					Accept: 'application/json',
// 				},
// 			}
// 		)

// 		// If the response is empty,
// 		if (response.data === '') {
// 			res.json({
// 				status: 'failure',
// 				message:
// 					'Invalid credentials. We could not find an account with the provided information.',
// 			})
// 			return
// 		}

// 		res.json({ status: 'success', user: response.data })
// 	} catch (error) {
// 		console.error('Error proxying request to Zoho API:', error)
// 		res.status(500).send('Error proxying request to Zoho.')
// 	}
// })

// Catch all 404
app.get('/*', (req, res) => {
	res.status(404).send('Looks like you have lost your way!')
})

// Start the server
app.listen(port, () => {
	console.log(`Proxy server is running on port ${port}`)
})
