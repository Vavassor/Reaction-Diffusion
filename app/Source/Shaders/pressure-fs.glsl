// Computes one iteration of pressure approximation using the Jacobi method.

precision mediump float;

uniform sampler2D divergence_field;
uniform sampler2D pressure_field;
uniform vec2 field_size;

varying vec2 surface_texcoord;

void main()
{
    vec2 pixel_size = 1.0 / field_size;
    float divergence = texture2D(divergence_field, surface_texcoord).x;
    float west = texture2D(pressure_field, surface_texcoord - vec2(2.0 * pixel_size.x, 0.0)).x;
    float east = texture2D(pressure_field, surface_texcoord + vec2(2.0 * pixel_size.x, 0.0)).x;
    float south = texture2D(pressure_field, surface_texcoord - vec2(0.0, 2.0 * pixel_size.y)).x;
    float north = texture2D(pressure_field, surface_texcoord + vec2(0.0, 2.0 * pixel_size.y)).x;
    float pressure = 0.25 * (divergence + west + east + south + north);
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}