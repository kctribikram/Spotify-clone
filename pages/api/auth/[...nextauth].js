import NextAuth from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"
import spotifyApi, { LOGIN_URL } from "../../../lib/spotify"

async function refreshAccessToken(token){
    try{

        spotifyApi.setAccessToken(token.accessToken);
        spotifyApi.setRefreshToken(token.refreshToken);

        const { body: refreshedToken } = await spotifyApi.refreshAccessToken();
        console.log("Refreshed Token IS" , refreshedToken);
        return{
            ...token,
            accessToken: refreshedToken.access_token,
            accessTokenExpires: Date.now + refreshedToken.expires_in * 1000,
            refreshToken: refreshedToken.refresh_token ?? token.refreshToken,

        }

    }catch(error){
        console.log(error);
        return{
            ...token,
            error: "RefreshAccessTokeError"
        }
    }
}

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
        clientId: '0de9b2acaedd4ebb928bc38b6e55cd27',
        clientSecret: '340961c00c4640139ca99f798724735d',
        authorization: LOGIN_URL,
    }),
    // ...add more providers here
  ],
  secret: process.env.JWT_SECRET,
  pages:{
    signIn: '/login'
  },
  callbacks:{
    async jwt({ token, account, user }){
        // initial sign in
        if(account && user){
            return{
                ...token,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                username: account.providerAccountId,
                accessTokenExpires: account.expires_at * 1000,  
                // we are handelling expiry times in millisecondes hence * 1000
            }
        }

        // return previous token if the access token has not expired yet
        if(Date.now() < token.accessTokenExpires){
            return token;
        }

        // Access token has expired, so we need to refresh it..
        console.log("ACCESS TOKEN HAS EXPIRED, REFRESJINH...");
        return await refreshAccessToken(token)
    },

    async session({ session, token }){
        session.user.accessToken = token.accessToken;
        session.user.refreshToken = token.refreshToken;
        session.user.username = token.username;

        return session;
    }
  }
})