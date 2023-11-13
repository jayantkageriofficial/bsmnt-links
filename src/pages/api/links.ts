import { NextApiRequest, NextApiResponse } from 'next'

import { internalServerError, success } from '~/lib/api-responses'
import { getAllShortLink } from '~/lib/redis'

export default async (_: NextApiRequest, res: NextApiResponse) => {
  try {
    success(res, { successData: await getAllShortLink() })
    return
  } catch (error) {
    internalServerError(res, error)
    return
  }
}
