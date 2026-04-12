// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { username, password } = credentials

        try {
          const res = await fetch(`${process.env.API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          })

          const json = await res.json()

          if (!res.ok || !json.success) {
            throw new Error(json.message || 'Login gagal')
          }

          // Simpan data user + token ke session
          return {
            id: json.data.user.id,
            name: json.data.user.full_name,
            username: json.data.user.username,
            email: json.data.user.email,
            roles: json.data.user.roles,
            permissions: json.data.user.permissions,
            accessToken: json.data.access_token,
            refreshToken: json.data.refresh_token,
          }
        } catch (e) {
          throw new Error(e.message)
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60 // 7 hari — sesuai refresh token expiry
  },

  pages: {
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user }) {
      // Saat login pertama kali, user object tersedia
      if (user) {
        token.id = user.id
        token.name = user.name
        token.username = user.username
        token.email = user.email
        token.roles = user.roles
        token.permissions = user.permissions
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.username = token.username
        session.user.email = token.email
        session.user.roles = token.roles
        session.user.permissions = token.permissions
        session.user.accessToken = token.accessToken
        session.user.refreshToken = token.refreshToken
      }

      return session
    }
  }
}
