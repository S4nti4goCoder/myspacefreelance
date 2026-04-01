import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  usePageTitle("Politica de Privacidad");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-6 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Politica de Privacidad y Tratamiento de Datos Personales
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Ultima actualizacion: 31 de marzo de 2026
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Responsable del tratamiento</h2>
            <p>
              MySpaceFreelance (en adelante, "la Plataforma") es una herramienta de gestion de proyectos
              para freelancers. El responsable del tratamiento de los datos personales recopilados a traves
              de esta plataforma es el titular de la cuenta tipo Freelancer que administra su espacio de trabajo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Marco legal</h2>
            <p>
              Esta politica se rige por la <strong>Ley 1581 de 2012</strong> (Ley de Proteccion de Datos Personales),
              el <strong>Decreto 1377 de 2013</strong> y demas normativa aplicable en la Republica de Colombia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Datos que recopilamos</h2>
            <p>La Plataforma recopila los siguientes datos personales:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Datos de identificacion:</strong> nombre completo, correo electronico, telefono, NIT (para freelancers).</li>
              <li><strong>Datos de ubicacion:</strong> ciudad y direccion (opcionales, proporcionados por el usuario).</li>
              <li><strong>Datos de clientes:</strong> nombre, correo electronico, telefono y notas del cliente registrados por el freelancer.</li>
              <li><strong>Datos de proyectos:</strong> nombres de proyectos, descripciones, presupuestos, fechas, archivos adjuntos y comentarios.</li>
              <li><strong>Datos financieros:</strong> montos de pagos, metodos de pago y datos de cotizaciones.</li>
              <li><strong>Datos de acceso:</strong> credenciales de autenticacion (las contrasenas se almacenan de forma encriptada).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Finalidad del tratamiento</h2>
            <p>Los datos personales son tratados con las siguientes finalidades:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Permitir el registro, autenticacion y gestion de cuentas de usuario.</li>
              <li>Facilitar la gestion de proyectos, tareas, documentos y pagos.</li>
              <li>Generar cotizaciones y reportes financieros.</li>
              <li>Habilitar la comunicacion entre freelancers y sus clientes a traves de comentarios.</li>
              <li>Enviar notificaciones relacionadas con la actividad en la plataforma.</li>
              <li>Permitir la asignacion de colaboradores y gestion de permisos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Autorizacion y consentimiento</h2>
            <p>
              De conformidad con el articulo 9 de la Ley 1581 de 2012, el tratamiento de datos personales
              requiere la autorizacion previa, expresa e informada del titular. Al registrarse en la Plataforma
              o ser registrado como cliente por un freelancer, el titular acepta el tratamiento de sus datos
              conforme a esta politica.
            </p>
            <p>
              El freelancer que registre cuentas de clientes es responsable de informar a dichos clientes
              sobre el tratamiento de sus datos y obtener su consentimiento previo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Derechos de los titulares</h2>
            <p>
              En cumplimiento del articulo 8 de la Ley 1581 de 2012, los titulares de los datos tienen derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Conocer:</strong> acceder a sus datos personales que hayan sido objeto de tratamiento.</li>
              <li><strong>Actualizar:</strong> solicitar la actualizacion de datos incompletos, inexactos o desactualizados.</li>
              <li><strong>Rectificar:</strong> corregir la informacion que sea inexacta.</li>
              <li><strong>Suprimir:</strong> solicitar la eliminacion de sus datos cuando considere que no estan siendo tratados conforme a la ley.</li>
              <li><strong>Revocar:</strong> revocar la autorizacion otorgada para el tratamiento de datos.</li>
              <li><strong>Presentar quejas:</strong> ante la Superintendencia de Industria y Comercio (SIC) por el uso indebido de sus datos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Almacenamiento y seguridad</h2>
            <p>
              Los datos se almacenan en servidores de <strong>Supabase</strong> con las siguientes medidas de seguridad:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encriptacion de contrasenas mediante algoritmos seguros (bcrypt).</li>
              <li>Comunicacion cifrada mediante HTTPS/TLS.</li>
              <li>Politicas de seguridad a nivel de fila (Row Level Security) en la base de datos.</li>
              <li>Tokens de autenticacion con expiracion automatica (JWT).</li>
              <li>Archivos almacenados en buckets privados con control de acceso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Conservacion de datos</h2>
            <p>
              Los datos personales se conservaran mientras la cuenta del usuario este activa o mientras
              sea necesario para cumplir con las finalidades descritas. El titular puede solicitar la
              eliminacion de su cuenta y datos en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Transferencia de datos</h2>
            <p>
              La Plataforma no comparte, vende ni transfiere datos personales a terceros con fines
              comerciales. Los datos pueden ser procesados por proveedores de infraestructura (Supabase/AWS)
              bajo acuerdos de confidencialidad y proteccion de datos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Canales de atencion</h2>
            <p>
              Para ejercer sus derechos como titular de datos personales, presentar consultas o reclamos,
              puede comunicarse a traves de los datos de contacto registrados en el perfil del freelancer
              administrador de su espacio de trabajo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Modificaciones</h2>
            <p>
              La Plataforma se reserva el derecho de modificar esta politica en cualquier momento.
              Las modificaciones seran comunicadas a los usuarios a traves de la plataforma y entraran
              en vigencia a partir de su publicacion.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
