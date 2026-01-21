const fastify = require('fastify')({ logger: true })



fastify.get("/", async (request, reply) => {
  return { hello: "Funcionando puerto 3001" };
});


const starserver = async () => {
  try {
    await fastify.listen({ port: process.env.AUTH_PORT, host: "0.0.0.0" });
    console.log(`Servidor de autenticación escuchando en el puerto ${process.env.AUTH_PORT}`);
  } catch (err) {
    fastify.log.error(err);
   
  }
  }
starserver();



