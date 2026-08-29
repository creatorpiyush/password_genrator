/**
 * Passport.js Strategy & Session Configuration
 */
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { AuthService } from '../services/authService.js';

export const hasRealGoogleKeys = () => Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_ID.includes('your_google_client_id')
);

export const hasRealGitHubKeys = () => Boolean(
  process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_SECRET &&
  !process.env.GITHUB_CLIENT_ID.includes('your_github_client_id')
);

export const configurePassport = () => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  if (hasRealGoogleKeys()) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username || 'google_user'}@google.com`;
            const username = profile.displayName || profile.username || 'Google User';
            const providerId = String(profile.id);
            const user = await AuthService.findOrCreateOAuthUser({ email, username, provider: 'google', providerId });
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  if (hasRealGitHubKeys()) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/v1/auth/github/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username || 'github_user'}@users.noreply.github.com`;
            const username = profile.displayName || profile.username || 'GitHub User';
            const providerId = String(profile.id);
            const user = await AuthService.findOrCreateOAuthUser({ email, username, provider: 'github', providerId });
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }
};
