var raytraceFS = `
struct Ray {
  vec3 pos;
  vec3 dir;
};

struct Material {
  vec3  k_d;  // diffuse coefficient
  vec3  k_s;  // specular coefficient
  float n;  // specular exponent
};

struct Sphere {
  vec3     center;
  float    radius;
  Material mtl;
};

struct Light {
  vec3 position;
  vec3 intensity;
};

struct HitInfo {
  float    t;
  vec3     position;
  vec3     normal;
  Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );
bool IntersectShadowRay( Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
  vec3 color = 0.05*mtl.k_d;
  for ( int i=0; i<NUM_LIGHTS; ++i ) {
    // TO-DO: Check for shadows
    Ray shadowRay;
    shadowRay.pos = position;
    shadowRay.dir = normalize(lights[i].position - position);
    if (!IntersectShadowRay( shadowRay )) {
      // TO-DO: If not shadowed, perform shading using the Blinn model
      vec3 lightVector = normalize(lights[i].position);
      vec3 halfwayVec = normalize(lightVector + view);
      float geometryFactor = dot(lightVector, normal);
      if (geometryFactor > 0.) {
        color +=
          lights[i].intensity * (
            mtl.k_d*geometryFactor +
            mtl.k_s*pow(dot(halfwayVec, normal), mtl.n)
          ); // change this line
      }
    }
  }
  return color;
}

bool IntersectShadowRay( Ray ray )
{
  for ( int i=0; i<NUM_SPHERES; ++i ) {
    float coefA = dot(ray.dir, ray.dir);
    vec3 rayToCenter = ray.pos - spheres[i].center;
    float coefB = 2.*dot(ray.dir, rayToCenter);
    float coefC = dot(rayToCenter, rayToCenter) - spheres[i].radius*spheres[i].radius;
    float discriminant = coefB*coefB - 4.*coefA*coefC;

    float epsilon = 0.003;
    if (discriminant > 0. && (-coefB - sqrt(discriminant))/(2.*coefA) > epsilon) { return true; }
  }
  return false;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
  hit.t = 1e30;
  bool foundHit = false;
  for ( int i=0; i<NUM_SPHERES; ++i ) {
    // TO-DO: Test for ray-sphere intersection
    float coefA = dot(ray.dir, ray.dir);
    vec3 rayToCenter = ray.pos - spheres[i].center;
    float coefB = 2.*dot(ray.dir, rayToCenter);
    float coefC = dot(rayToCenter, rayToCenter) - spheres[i].radius*spheres[i].radius;
    float discriminant = coefB*coefB - 4.*coefA*coefC;
    // TO-DO: If intersection is found, update the given HitInfo
    if (discriminant > 0.) {

      float hitDistance = (-coefB - sqrt(discriminant))/(2.*coefA);
      if (hitDistance > 0. && hitDistance < hit.t) {
        foundHit = true;
        hit.t = hitDistance;
        hit.position = ray.pos + hitDistance*ray.dir;
        hit.normal   = (hit.position - spheres[i].center)/spheres[i].radius;
        hit.mtl      = spheres[i].mtl;
      }
    }
  }
  return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
  HitInfo hit;
  if ( IntersectRay( hit, ray ) ) {
    vec3 view = normalize( -ray.dir );
    vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
    
    // Compute reflections
    vec3 k_s = hit.mtl.k_s;
    for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
      if ( bounce >= bounceLimit ) break;
      if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
      
      Ray r;  // this is the reflection ray
      HitInfo h;  // reflection hit info
      
      // TO-DO: Initialize the reflection ray
      r.dir = reflect(normalize(ray.dir), hit.normal);
      r.pos = hit.position;
      
      if ( IntersectRay( h, r ) ) {
        // TO-DO: Hit found, so shade the hit point
        clr += k_s * Shade( h.mtl, h.position, h.normal, normalize(-r.dir) );
        // TO-DO: Update the loop variables for tracing the next reflection ray
        ray = r;
        hit = h;
        k_s = h.mtl.k_s;
      } else {
        // The refleciton ray did not intersect with anything,
        // so we are using the environment color
        clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
        break;  // no more reflections
      }
    }
    return vec4( clr, 1 );  // return the accumulated color, including the reflections
  } else {
    return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 1 ); // return the environment color
  }
}
`;
