declare module '@ioc:App/Helpers/SendData' {
  const sendData: (data: any, code?: number, error?: any) => {code: number, data: any, error: any};
  export default sendData;
}
