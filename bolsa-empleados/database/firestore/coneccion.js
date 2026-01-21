import Fastify from 'fastify';
import fastifyFirebase from 'fastify-firebase';
import firebasePrivateKeyJson from './database/firestore/serviceAccountKey.json'; // Reemplaza con tu ruta real

const server = Fastify({ logger: true });

server.register(fastifyFirebase, firebasePrivateKeyJson); // Registra el plugin con las credenciales

