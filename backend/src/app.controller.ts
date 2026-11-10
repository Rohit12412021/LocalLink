import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: "LocalLink Backend is running",
    };
  }

  @Get("api/health")
  healthCheck() {
    return {
      status: "ok",
      message: "LocalLink API is working",
    };
  }
}