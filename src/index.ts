import { MikroORM } from '@mikro-orm/core';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
// import { Post } from "./entities/Post";
import ormConfig from './mikro-orm.config';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { __prod__ } from './constants';
import { MyContext } from './types';

const main = async () => {
  const orm = await MikroORM.init(ormConfig);
  await orm.getMigrator().up();

  const app = express(),
    RedisStore = connectRedis(session),
    redisClient = redis.createClient();

  app.use(
    session({
      name: 'qid',
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      secret: 'vdsbccnsjnlcknhbreyug',
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        secure: __prod__,
        sameSite: 'lax'
      },
      saveUninitialized: false,
      resave: false
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res })
  });

  apolloServer.applyMiddleware({ app });
  app.listen(4000, () => console.log('server started on 4000'));
};

main().catch(err => console.log(err));
