import { auth } from "../../../../auth";

export const GET = async (request: Request): Promise<Response> => {
  return auth.handler(request);
};

export const POST = async (request: Request): Promise<Response> => {
  return auth.handler(request);
};
