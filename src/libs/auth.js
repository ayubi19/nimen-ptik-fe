// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'

// Refresh access token menggunakan refresh token
async function refreshAccessToken(token) {
  try {
    const res = await fetch(`${process.env.API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token.refreshToken })
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      // Refresh token juga expired — paksa logout
      return { ...token, error: 'RefreshTokenExpired' }
    }

    return {
      ...token,
      accessToken: json.data.access_token,
      error: null
    }
  } catch {
    return { ...token, error: 'RefreshTokenExpired' }
  }
}

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

          return {
            id: json.data.user.id,
            name: json.data.user.full_name,
            username: json.data.user.username,
            email: json.data.user.email,
            roles: json.data.user.roles,
            permissions: json.data.user.permissions,
            accessToken: json.data.access_token,
            refreshToken: json.data.refresh_token,
            accessTokenExpiry: Date.now() + (14 * 60 * 1000),
            mustChangePassword: json.data.user.must_change_password ?? false,
          }
        } catch (e) {
          throw new Error(e.message)
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60 // 7 hari
  },

  pages: {
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user }) {
      // Login pertama kali
      if (user) {
        return {
          ...token,
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpiry: user.accessTokenExpiry,
          mustChangePassword: user.mustChangePassword,
          error: null,
        }
      }

      // Token masih valid
      if (Date.now() < token.accessTokenExpiry) {
        return token
      }

      // Token expired — refresh
      return refreshAccessToken(token)
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
        session.user.mustChangePassword = token.mustChangePassword
        session.error = token.error
      }

      return session
    }
  }
}
