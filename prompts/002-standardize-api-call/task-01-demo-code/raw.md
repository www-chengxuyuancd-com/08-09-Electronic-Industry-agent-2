this project is just initialized, now i want to standardize the front-end and back-end communication

## backend

- write next.js api routes in `@/app/api/`
- follow rest-ful design
- provide a error wrapper to return structured error, inlcude type (client error, server error) and error message

## frontend

- use client components
- build a api-client.ts in `@/lib/` to wrap the api call
- manage api clients in `@/api-clients/` folder for each api route, should include request and response interface, and the call method
- in client components, use api clients to call backend
- if error, always use sonner toaster to toast error

# requirement

now you need to implement 2 demo apis

- `/demo/hello` to respond ok content
- `/demo/error` to respond error content

also implement the api-client.ts and api clients

finnaly you should add 2 demo buttons to call these 2 apis in HomePage
