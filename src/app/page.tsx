import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Kreu</h1>
        </div>
      </div>
      
      <div className="flex-1 container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Building2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Pronat</CardTitle>
              <CardDescription>
                Menaxho të gjitha pronat me qera
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/prona">
                <Button className="w-full">
                  Shiko pronat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Raportet</CardTitle>
              <CardDescription>
                Raportet do të shtohen së shpejti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled className="w-full">
                Së shpejti
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Mirë se vini në Sukaj Prona</h2>
          <p className="text-muted-foreground max-w-2xl">
            Ky është sistemi juaj për menaxhimin e pronave me qera. Përdorni menunë në të majtë 
            për të naviguar midis kategorive të ndryshme të pronave.
          </p>
        </div>
      </div>
    </div>
  );
}
