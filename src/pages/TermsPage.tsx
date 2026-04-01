import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  usePageTitle("Terminos y Condiciones");

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
          Terminos y Condiciones de Uso
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Ultima actualizacion: 31 de marzo de 2026
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Aceptacion de los terminos</h2>
            <p>
              Al acceder y utilizar MySpaceFreelance (en adelante, "la Plataforma"), usted acepta
              cumplir con estos Terminos y Condiciones. Si no esta de acuerdo con alguno de estos
              terminos, debe abstenerse de utilizar la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Descripcion del servicio</h2>
            <p>
              MySpaceFreelance es una plataforma de gestion de proyectos disenada para profesionales
              independientes (freelancers) que permite:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Administrar proyectos, tareas, documentos y archivos adjuntos.</li>
              <li>Gestionar cuentas de clientes y asignar proyectos.</li>
              <li>Crear y enviar cotizaciones con soporte de impuestos colombianos.</li>
              <li>Registrar pagos y generar reportes financieros.</li>
              <li>Invitar colaboradores con permisos configurables.</li>
              <li>Comunicarse con clientes a traves de comentarios por proyecto.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Tipos de usuario</h2>
            <p>La Plataforma contempla tres tipos de usuario:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Freelancer:</strong> titular de la cuenta principal con acceso completo a todas las funcionalidades.</li>
              <li><strong>Colaborador:</strong> usuario invitado por el freelancer con permisos limitados segun la configuracion asignada.</li>
              <li><strong>Cliente:</strong> usuario registrado por el freelancer con acceso exclusivo al portal de cliente para visualizar sus proyectos asignados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Registro y cuenta</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>La informacion proporcionada durante el registro debe ser veraz y actualizada.</li>
              <li>El freelancer es responsable de las cuentas de clientes y colaboradores que cree dentro de su espacio de trabajo.</li>
              <li>Los clientes reciben credenciales generadas por el freelancer y deben cambiar su contrasena en el primer inicio de sesion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Uso aceptable</h2>
            <p>El usuario se compromete a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar la Plataforma unicamente para fines legitimos de gestion de proyectos freelance.</li>
              <li>No cargar contenido ilicito, difamatorio o que infrinja derechos de terceros.</li>
              <li>No intentar acceder a datos de otros usuarios sin autorizacion.</li>
              <li>No realizar acciones que comprometan la seguridad o estabilidad de la Plataforma.</li>
              <li>Cumplir con la legislacion colombiana vigente en el ejercicio de su actividad profesional.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Propiedad del contenido</h2>
            <p>
              Todo el contenido cargado por el usuario (documentos, archivos, datos de proyectos, cotizaciones)
              es propiedad del usuario. La Plataforma no reclama ningun derecho de propiedad sobre dicho contenido.
            </p>
            <p>
              El codigo fuente, diseno y funcionalidades de la Plataforma son propiedad de sus desarrolladores
              y estan protegidos por las leyes de propiedad intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Responsabilidades del freelancer</h2>
            <p>El freelancer titular de la cuenta es responsable de:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Informar a sus clientes sobre el tratamiento de sus datos personales conforme a la Ley 1581 de 2012.</li>
              <li>Obtener el consentimiento previo de sus clientes antes de registrar sus datos en la Plataforma.</li>
              <li>Garantizar la veracidad de la informacion fiscal (NIT, tasas de impuestos) utilizada en cotizaciones.</li>
              <li>Gestionar adecuadamente los permisos de sus colaboradores.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Cotizaciones y datos fiscales</h2>
            <p>
              La Plataforma facilita la generacion de cotizaciones con soporte de IVA, Retefuente y ReteICA.
              Sin embargo, las tasas y calculos son configurados por el usuario. La Plataforma no se hace
              responsable de errores en los calculos fiscales ni sustituye la asesoria de un contador publico.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Disponibilidad del servicio</h2>
            <p>
              La Plataforma se ofrece "tal cual" y "segun disponibilidad". No se garantiza que el servicio
              sea ininterrumpido o libre de errores. Se realizaran esfuerzos razonables para mantener la
              disponibilidad, pero pueden ocurrir interrupciones por mantenimiento o causas de fuerza mayor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Limitacion de responsabilidad</h2>
            <p>
              La Plataforma no sera responsable por:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Perdida de datos ocasionada por mal uso del usuario.</li>
              <li>Decisiones comerciales tomadas con base en los reportes generados.</li>
              <li>Danos indirectos derivados del uso o imposibilidad de uso de la Plataforma.</li>
              <li>Incumplimientos fiscales o contractuales del freelancer con sus clientes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Proteccion de datos</h2>
            <p>
              El tratamiento de datos personales se realiza conforme a nuestra{" "}
              <Link to="/privacidad" className="text-primary hover:underline font-medium">
                Politica de Privacidad
              </Link>
              , elaborada en cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Suspension y terminacion</h2>
            <p>
              La Plataforma se reserva el derecho de suspender o terminar el acceso de cualquier usuario
              que incumpla estos terminos, sin previo aviso. El usuario puede eliminar su cuenta en
              cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">13. Legislacion aplicable</h2>
            <p>
              Estos terminos se rigen por las leyes de la Republica de Colombia. Cualquier controversia
              sera sometida a los tribunales competentes de la ciudad de Bogota D.C.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">14. Modificaciones</h2>
            <p>
              Estos terminos pueden ser modificados en cualquier momento. Las modificaciones entraran
              en vigencia a partir de su publicacion en la Plataforma. El uso continuado despues de
              una modificacion constituye la aceptacion de los nuevos terminos.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
