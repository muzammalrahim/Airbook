import { useRouter } from 'next/router'
import ResetPassword from './index'

const Post = () => {
  const router = useRouter()
  const { token } = router.query

  return <ResetPassword token={token} />
}

export default Post