export const errorRes = (res, error) => {
  const code = error.code || 422
  console.log(`\x1b[31mERROR: \x1b[35m ${error.message}\x1b[0m`)
  console.log(error)
  res.status(code > 511 ? 500 : code).json({ success: false, message: error.message }).end()
}


/**
 * Return success result
 * @param { Express.Response } res 
 * @param { any } obj 
 * @param { number } code 
 */
export const successRes = (res, obj, code = 200) => {
  res.status(code).json({ success: true, payload: obj }).end()
}