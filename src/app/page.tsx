import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b">
        <div className="px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-bold">Kreu</h1>
        </div>
      </div>
      
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8">
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <Building2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg md:text-xl">Pronat</CardTitle>
              <CardDescription className="text-sm">
                Menaxho të gjitha pronat me qera
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/prona">
                <Button className="w-full h-10">
                  Shiko pronat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg md:text-xl">Raportet</CardTitle>
              <CardDescription className="text-sm">
                Raportet do të shtohen së shpejti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled className="w-full h-10">
                Së shpejti
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 md:mt-12">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Mirë se vini në Sukaj Prona</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Ky është sistemi juaj për menaxhimin e pronave me qera. Përdorni menunë 
            <span className="hidden lg:inline"> në të majtë</span>
            <span className="lg:hidden"> (ikona ☰ lart-majtas)</span>
            {' '}për të naviguar midis kategorive të ndryshme të pronave.
          </p>
        </div>
      </div>
    </div>
  );
}
