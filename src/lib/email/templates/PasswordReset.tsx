import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  displayName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function PasswordResetEmail({
  displayName,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Réinitialisation de votre mot de passe Keyni</Preview>
      <Body
        style={{
          backgroundColor: "#f7f5ef",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', Segoe UI, Roboto, sans-serif",
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            maxWidth: 560,
            margin: "0 auto",
            padding: 32,
          }}
        >
          <Section style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#14b8a6",
                fontWeight: 700,
                fontSize: 22,
                margin: 0,
              }}
            >
              Keyni
            </Text>
          </Section>

          <Heading
            style={{
              color: "#0f172a",
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            Bonjour {displayName},
          </Heading>

          <Text style={{ color: "#475569", fontSize: 15, lineHeight: "22px" }}>
            Vous avez demandé à réinitialiser le mot de passe de votre espace
            client Keyni. Cliquez sur le bouton ci-dessous pour définir un
            nouveau mot de passe. Ce lien est valable {expiresInMinutes} minutes.
          </Text>

          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: "#14b8a6",
                borderRadius: 10,
                color: "#ffffff",
                fontWeight: 600,
                padding: "14px 24px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Réinitialiser mon mot de passe
            </Button>
          </Section>

          <Text style={{ color: "#94a3b8", fontSize: 13, lineHeight: "20px" }}>
            Ou copiez-collez ce lien dans votre navigateur :
          </Text>
          <Text style={{ color: "#0f172a", fontSize: 13, wordBreak: "break-all" }}>
            <Link href={resetUrl} style={{ color: "#0ea598" }}>
              {resetUrl}
            </Link>
          </Text>

          <Text
            style={{
              color: "#94a3b8",
              fontSize: 13,
              marginTop: 32,
              lineHeight: "20px",
            }}
          >
            Si vous n'êtes pas à l'origine de cette demande, ignorez simplement
            cet email. Votre mot de passe actuel reste valable.
          </Text>
        </Container>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 12,
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Keyni — Néo-assureur immobilier
        </Text>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
