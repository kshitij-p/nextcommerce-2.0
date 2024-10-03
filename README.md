# About

This is an ecommerce market place site created using NextJs, PostgreSQL, Stripe, Cloudflare R2 and Prisma.

### [Go to website](https://nextcommerce-2-0.vercel.app/)

![Alt text](/docs/screenshots/products-page.png "a title")

# Tech Choices

## Why NextJs for the backend server ?

The DX of NextJs makes development a breeze - this entire project was built in just 2 days.
Plus, despite the cold start problem, a next js server for hobby purposes is going to be pretty much free (esp if you stay on the free-use hobby use tier).
Further scaling is a non-concern for this app. However, if this was expected to get a lot of traffic, migrating the app to "serverful"
backend on NestJs or Golang would be necessary, but until then the simple DX from using NextJs makes using it a no-brainer.

## Why tRPC ?

Because despite react server components "fixing" the typesafety concern, the reality is that you will have to use react-query
or some promise management solution on the client-side eventually for complex UI use-cases, such as optimistic updates for example,
and then if your server is on NextJs, you would wish you had used tRPC - it is the simplest and fastest way to build CRUD backends.

## Why Neon for PostgreSQL ?

Same reason as why NextJs, it just works, is simple to setup and has a permanent free tier which means even if I forget about
this project, it won't ever go down as long as its opened once a month or so. For real world production use-cases RDS would
definitely be required.

## Why Cloudflare R2 ?

Its cheaper, has an always free tier, simpler to setup with a CDN and this project doesn't need ACL so its a no-brainer to use CF R2 over AWS S3.
Besides, its trivial to swap this out for a S3 bucket as the project uses the S3 SDK to interact with the bucket instead of Workers API.
