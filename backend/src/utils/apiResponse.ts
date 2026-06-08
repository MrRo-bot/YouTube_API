class ApiResponse {
  statusCode: number;
  success: boolean;
  message: string | "Success";
  data: any | null;
  constructor(
    statusCode: number,
    success: boolean,
    message: string | "Success",
    data: any | null
  ) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    this.data = data;
  }
}

export { ApiResponse };
